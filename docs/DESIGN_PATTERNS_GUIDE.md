# Bluesky React Native デザインパターン完全ガイド

## 🎨 概要
このガイドでは、Blueskyアプリケーションで使用されている主要なReact/React Nativeデザインパターンを詳しく解説します。
大規模アプリケーションでの実践的なパターンの適用方法と、その設計思想を学習できます。

## 🏗️ アーキテクチャパターン

### 1. Provider Pattern (プロバイダーパターン)

#### 概要
React Contextを活用して、アプリケーション全体に状態や機能を提供するパターン。
Blueskyでは13層のProviderが階層構造を形成し、依存性注入を実現しています。

#### 実装例: セッションプロバイダー

```typescript
// src/state/session/index.tsx

/**
 * セッション状態のContext定義
 * 認証状態、ユーザー情報、セッション管理機能を提供
 */
interface SessionContextValue {
  // 状態
  accounts: SessionAccount[]
  currentAccount: SessionAccount | null
  hasSession: boolean
  isInitialLoad: boolean
  
  // アクション
  createAccount: (service: string) => Promise<void>
  login: (identifier: string, password: string) => Promise<void>
  logout: () => Promise<void>
  switchAccount: (account: SessionAccount) => void
  
  // API
  agent: BskyAgent
}

const SessionContext = React.createContext<SessionContextValue | null>(null)

/**
 * セッションプロバイダーコンポーネント
 * 
 * 🔧 実装のポイント：
 * - 複数アカウント対応
 * - 永続化機能
 * - エラーハンドリング
 * - ライフサイクル管理
 */
export function SessionProvider({children}: {children: React.ReactNode}) {
  const [accounts, setAccounts] = useState<SessionAccount[]>([])
  const [currentAccount, setCurrentAccount] = useState<SessionAccount | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // BskyAgent インスタンス（AT Protocol クライアント）
  const agent = useMemo(() => new BskyAgent({
    service: currentAccount?.service ?? 'https://bsky.social'
  }), [currentAccount?.service])
  
  // アカウント作成処理
  const createAccount = useCallback(async (service: string) => {
    try {
      // 1. 新規セッション作成
      const response = await agent.createAccount({
        handle: generateHandle(),
        password: generateSecurePassword(),
        email: userEmail,
        inviteCode: inviteCode,
      })
      
      // 2. セッション情報を永続化
      const newAccount: SessionAccount = {
        service,
        did: response.data.did,
        handle: response.data.handle,
        accessJwt: response.data.accessJwt,
        refreshJwt: response.data.refreshJwt,
      }
      
      // 3. 状態更新
      setAccounts(prev => [...prev, newAccount])
      setCurrentAccount(newAccount)
      
      // 4. ストレージ保存
      await persistSession(newAccount)
      
    } catch (error) {
      // エラーハンドリング
      logger.error('Failed to create account', {error})
      throw error
    }
  }, [agent])
  
  // Context値の構築
  const value = useMemo(() => ({
    accounts,
    currentAccount,
    hasSession: !!currentAccount,
    isInitialLoad,
    createAccount,
    login: /* 実装省略 */,
    logout: /* 実装省略 */,
    switchAccount: /* 実装省略 */,
    agent,
  }), [accounts, currentAccount, isInitialLoad, createAccount, agent])
  
  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

// カスタムフック
export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}
```

#### 階層構造の設計

```typescript
// src/App.native.tsx

/**
 * Provider階層の構築
 * 外側から内側への依存関係に注意
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{flex: 1}}>
        <RootSiblingParent>
          <QueryProvider>
            <StatsigProvider>
              <ThemeProvider>
                <I18nProvider>
                  <SessionProvider>
                    <PrefsStateProvider>
                      <GeolocationProvider>
                        <MessagesProvider>
                          <InnerApp />
                        </MessagesProvider>
                      </GeolocationProvider>
                    </PrefsStateProvider>
                  </SessionProvider>
                </I18nProvider>
              </ThemeProvider>
            </StatsigProvider>
          </QueryProvider>
        </RootSiblingParent>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  )
}
```

### 2. Compound Component Pattern (複合コンポーネントパターン)

#### 概要
関連する複数のコンポーネントを組み合わせて、柔軟なAPIを提供するパターン。
UIの構造を宣言的に表現でき、再利用性と拡張性が向上します。

#### 実装例: Buttonコンポーネント

```typescript
// src/components/Button.tsx

/**
 * Button複合コンポーネント
 * 
 * 使用例:
 * <Button variant="primary" size="large">
 *   <Button.Icon icon={PlusIcon} />
 *   <Button.Text>新規作成</Button.Text>
 * </Button>
 */

interface ButtonContextValue {
  variant: 'primary' | 'secondary' | 'ghost'
  size: 'small' | 'medium' | 'large'
  disabled: boolean
  loading: boolean
}

const ButtonContext = createContext<ButtonContextValue | null>(null)

// メインのButtonコンポーネント
export function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onPress,
  children,
  ...props
}: ButtonProps) {
  const contextValue = {variant, size, disabled, loading}
  
  return (
    <ButtonContext.Provider value={contextValue}>
      <Pressable
        style={[
          styles.button,
          styles[variant],
          styles[size],
          disabled && styles.disabled,
        ]}
        onPress={disabled || loading ? undefined : onPress}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Button.Spinner />}
        {children}
      </Pressable>
    </ButtonContext.Provider>
  )
}

// Button.Textサブコンポーネント
function ButtonText({children, style, ...props}: TextProps) {
  const context = useContext(ButtonContext)
  if (!context) {
    throw new Error('Button.Text must be used within Button')
  }
  
  const {variant, size, disabled, loading} = context
  
  return (
    <Text
      style={[
        styles.buttonText,
        styles[`${variant}Text`],
        styles[`${size}Text`],
        disabled && styles.disabledText,
        loading && styles.loadingText,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  )
}

// Button.Iconサブコンポーネント
function ButtonIcon({icon: Icon, style, ...props}: IconProps) {
  const context = useContext(ButtonContext)
  if (!context) {
    throw new Error('Button.Icon must be used within Button')
  }
  
  const {size, disabled} = context
  
  return (
    <Icon
      style={[
        styles.buttonIcon,
        styles[`${size}Icon`],
        disabled && styles.disabledIcon,
        style,
      ]}
      {...props}
    />
  )
}

// Button.Spinnerサブコンポーネント
function ButtonSpinner({style, ...props}: SpinnerProps) {
  const context = useContext(ButtonContext)
  if (!context) {
    throw new Error('Button.Spinner must be used within Button')
  }
  
  const {size} = context
  
  return (
    <ActivityIndicator
      style={[
        styles.buttonSpinner,
        styles[`${size}Spinner`],
        style,
      ]}
      color={getSpinnerColor(context)}
      {...props}
    />
  )
}

// 複合コンポーネントの結合
Button.Text = ButtonText
Button.Icon = ButtonIcon
Button.Spinner = ButtonSpinner
```

### 3. Render Props Pattern (レンダープロップパターン)

#### 概要
コンポーネントのロジックをUIから分離し、柔軟なレンダリングを可能にするパターン。
データ取得やイベント処理のロジックを再利用できます。

#### 実装例: 無限スクロールコンポーネント

```typescript
// src/components/InfiniteList.tsx

interface InfiniteListProps<T> {
  // データ取得関数
  fetchMore: (cursor?: string) => Promise<{
    data: T[]
    nextCursor?: string
  }>
  
  // 初期データ
  initialData?: T[]
  
  // レンダー関数（Render Props）
  renderItem: (item: T, index: number) => React.ReactElement
  renderEmpty?: () => React.ReactElement
  renderLoading?: () => React.ReactElement
  renderError?: (error: Error, retry: () => void) => React.ReactElement
  
  // リスト設定
  keyExtractor: (item: T, index: number) => string
  estimatedItemSize?: number
}

/**
 * 無限スクロールロジックを提供するコンポーネント
 * UIの詳細は render props で委譲
 */
export function InfiniteList<T>({
  fetchMore,
  initialData = [],
  renderItem,
  renderEmpty,
  renderLoading,
  renderError,
  keyExtractor,
  estimatedItemSize = 100,
}: InfiniteListProps<T>) {
  const [data, setData] = useState<T[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | undefined>()
  
  // 追加データ読み込み
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetchMore(cursor)
      
      setData(prev => [...prev, ...response.data])
      setCursor(response.nextCursor)
      setHasMore(!!response.nextCursor)
      
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [fetchMore, cursor, loading, hasMore])
  
  // エラー時の再試行
  const retry = useCallback(() => {
    setError(null)
    loadMore()
  }, [loadMore])
  
  // エラー状態のレンダリング
  if (error && data.length === 0) {
    return renderError ? renderError(error, retry) : (
      <View style={styles.errorContainer}>
        <Text>Error: {error.message}</Text>
        <Button onPress={retry}>Retry</Button>
      </View>
    )
  }
  
  // 空状態のレンダリング
  if (data.length === 0 && !loading) {
    return renderEmpty ? renderEmpty() : (
      <View style={styles.emptyContainer}>
        <Text>No data available</Text>
      </View>
    )
  }
  
  return (
    <FlashList
      data={data}
      renderItem={({item, index}) => renderItem(item, index)}
      keyExtractor={keyExtractor}
      estimatedItemSize={estimatedItemSize}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={() => 
        loading && renderLoading ? renderLoading() : (
          loading ? <ActivityIndicator /> : null
        )
      }
    />
  )
}

// 使用例
function PostFeedScreen() {
  return (
    <InfiniteList
      fetchMore={async (cursor) => {
        const response = await api.getFeed({cursor})
        return {
          data: response.data.feed,
          nextCursor: response.data.cursor,
        }
      }}
      renderItem={(post, index) => (
        <PostItem key={post.uri} post={post} />
      )}
      renderEmpty={() => (
        <EmptyState 
          title="フィードが空です"
          subtitle="新しい投稿をフォローしてみましょう"
        />
      )}
      renderLoading={() => <PostSkeleton />}
      keyExtractor={(post) => post.uri}
    />
  )
}
```

### 4. Higher-Order Component (HOC) Pattern

#### 概要
コンポーネントを引数に取り、拡張されたコンポーネントを返す関数。
横断的関心事（認証、ログ、エラーハンドリング等）を分離できます。

#### 実装例: 認証が必要なコンポーネントのラッパー

```typescript
// src/components/hocs/withAuth.tsx

/**
 * 認証が必要なコンポーネントをラップするHOC
 * 
 * @param WrappedComponent - ラップ対象のコンポーネント
 * @param options - 認証オプション
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    redirectTo?: string
    requiredRoles?: string[]
    showLoadingSpinner?: boolean
  } = {}
) {
  const {
    redirectTo = '/login',
    requiredRoles = [],
    showLoadingSpinner = true,
  } = options
  
  return function AuthenticatedComponent(props: P) {
    const {hasSession, currentAccount, isInitialLoad} = useSession()
    const navigation = useNavigation()
    
    // 初期読み込み中
    if (isInitialLoad && showLoadingSpinner) {
      return <LoadingSpinner />
    }
    
    // 未認証の場合はリダイレクト
    if (!hasSession) {
      useEffect(() => {
        navigation.navigate('SigninScreen')
      }, [navigation])
      
      return <UnauthorizedMessage />
    }
    
    // ロール確認
    if (requiredRoles.length > 0) {
      const userRoles = currentAccount?.roles ?? []
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role))
      
      if (!hasRequiredRole) {
        return <ForbiddenMessage requiredRoles={requiredRoles} />
      }
    }
    
    // 認証済みの場合は元のコンポーネントをレンダリング
    return <WrappedComponent {...props} />
  }
}

// 使用例
const ProtectedProfile = withAuth(ProfileEditScreen, {
  requiredRoles: ['user'],
  showLoadingSpinner: true,
})

const AdminPanel = withAuth(AdminDashboard, {
  requiredRoles: ['admin', 'moderator'],
  redirectTo: '/unauthorized',
})
```

### 5. Custom Hooks Pattern (カスタムフックパターン)

#### 概要
ロジックを再利用可能な関数として抽出し、複数のコンポーネントで共有するパターン。
状態管理、副作用、計算処理を分離できます。

#### 実装例: 無限スクロールフック

```typescript
// src/lib/hooks/useInfiniteScroll.ts

interface UseInfiniteScrollOptions<T> {
  // データ取得関数
  queryFn: (params: {pageParam?: string}) => Promise<{
    data: T[]
    nextPageParam?: string
  }>
  
  // クエリキー
  queryKey: unknown[]
  
  // オプション設定
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  initialData?: T[]
  
  // エラーハンドリング
  onError?: (error: Error) => void
  retry?: boolean | number
}

/**
 * 無限スクロール機能を提供するカスタムフック
 * 
 * TanStack Query の useInfiniteQuery をベースに、
 * React Native の FlashList と連携しやすい形で抽象化
 */
export function useInfiniteScroll<T>({
  queryFn,
  queryKey,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5分
  cacheTime = 30 * 60 * 1000, // 30分
  initialData = [],
  onError,
  retry = 3,
}: UseInfiniteScrollOptions<T>) {
  
  const query = useInfiniteQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    cacheTime,
    retry,
    
    // ページパラメータの取得
    getNextPageParam: (lastPage) => lastPage.nextPageParam,
    
    // エラーハンドリング
    onError: (error: Error) => {
      logger.error('Infinite scroll query failed', {error, queryKey})
      onError?.(error)
    },
    
    // 初期データの設定
    initialData: initialData.length > 0 ? {
      pages: [{data: initialData, nextPageParam: undefined}],
      pageParams: [undefined],
    } : undefined,
  })
  
  // フラット化されたデータ
  const data = useMemo(() => {
    return query.data?.pages.flatMap(page => page.data) ?? []
  }, [query.data])
  
  // 追加読み込み関数
  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage()
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage])
  
  // リフレッシュ関数
  const refresh = useCallback(async () => {
    await query.refetch()
  }, [query.refetch])
  
  // 手動でデータを更新
  const updateItem = useCallback((updater: (items: T[]) => T[]) => {
    if (!query.data) return
    
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData
      
      const newData = updater(data)
      const itemsPerPage = oldData.pages[0]?.data.length ?? newData.length
      
      // データをページ毎に分割
      const pages = []
      for (let i = 0; i < newData.length; i += itemsPerPage) {
        pages.push({
          data: newData.slice(i, i + itemsPerPage),
          nextPageParam: i + itemsPerPage < newData.length ? `page-${i + itemsPerPage}` : undefined,
        })
      }
      
      return {
        pages,
        pageParams: oldData.pageParams.slice(0, pages.length),
      }
    })
  }, [queryKey, data])
  
  return {
    // データ
    data,
    
    // ステータス
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    
    // アクション
    loadMore,
    refresh,
    updateItem,
    
    // キャッシュ制御
    invalidate: () => queryClient.invalidateQueries(queryKey),
    prefetch: (pageParam?: string) => queryClient.prefetchInfiniteQuery({
      queryKey,
      queryFn: ({pageParam}) => queryFn({pageParam}),
      getNextPageParam: (lastPage) => lastPage.nextPageParam,
    }),
  }
}

// 使用例
function PostFeedScreen() {
  const {
    data: posts,
    isLoading,
    loadMore,
    refresh,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteScroll({
    queryKey: ['posts', 'feed'],
    queryFn: async ({pageParam}) => {
      const response = await api.getFeed({cursor: pageParam})
      return {
        data: response.data.feed,
        nextPageParam: response.data.cursor,
      }
    },
  })
  
  if (isLoading) {
    return <PostFeedSkeleton />
  }
  
  return (
    <FlashList
      data={posts}
      renderItem={({item}) => <PostItem post={item} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      onRefresh={refresh}
      refreshing={isLoading}
      ListFooterComponent={() => 
        isFetchingNextPage ? <LoadingSpinner /> : null
      }
    />
  )
}
```

## 🎛️ 状態管理パターン

### 6. State Reducer Pattern (状態リデューサーパターン)

#### 概要
複雑な状態変更をreducerで管理し、予測可能な状態更新を実現するパターン。
useReducerフックとActionの組み合わせで実装します。

```typescript
// src/components/PostComposer/reducer.ts

interface ComposerState {
  text: string
  images: ImageAsset[]
  replyTo?: Post
  quotePost?: Post
  mentions: Mention[]
  tags: string[]
  
  // UI状態
  isSubmitting: boolean
  showImagePicker: boolean
  showEmojiPicker: boolean
  
  // バリデーション
  characterCount: number
  errors: string[]
}

type ComposerAction =
  | {type: 'SET_TEXT'; payload: string}
  | {type: 'ADD_IMAGE'; payload: ImageAsset}
  | {type: 'REMOVE_IMAGE'; payload: string}
  | {type: 'SET_REPLY_TO'; payload: Post | undefined}
  | {type: 'ADD_MENTION'; payload: Mention}
  | {type: 'TOGGLE_IMAGE_PICKER'}
  | {type: 'START_SUBMIT'}
  | {type: 'SUBMIT_SUCCESS'}
  | {type: 'SUBMIT_ERROR'; payload: string}

function composerReducer(state: ComposerState, action: ComposerAction): ComposerState {
  switch (action.type) {
    case 'SET_TEXT':
      const newText = action.payload
      const characterCount = calculateCharacterCount(newText)
      const mentions = extractMentions(newText)
      const tags = extractTags(newText)
      
      return {
        ...state,
        text: newText,
        characterCount,
        mentions,
        tags,
        errors: validatePost({...state, text: newText}),
      }
      
    case 'ADD_IMAGE':
      if (state.images.length >= MAX_IMAGES) {
        return {
          ...state,
          errors: [...state.errors, 'Maximum 4 images allowed'],
        }
      }
      
      return {
        ...state,
        images: [...state.images, action.payload],
        showImagePicker: false,
      }
      
    case 'START_SUBMIT':
      return {
        ...state,
        isSubmitting: true,
        errors: [],
      }
      
    case 'SUBMIT_SUCCESS':
      return initialState // リセット
      
    case 'SUBMIT_ERROR':
      return {
        ...state,
        isSubmitting: false,
        errors: [action.payload],
      }
      
    default:
      return state
  }
}
```

## 🔄 データフローパターン

### 7. Observer Pattern (オブザーバーパターン)

#### 概要
オブジェクトの状態変化を複数のコンポーネントに通知するパターン。
イベントバスやpub-sub システムとして実装されます。

```typescript
// src/state/events/index.ts

type EventType = 
  | 'session-dropped'
  | 'post-liked'
  | 'post-reposted'
  | 'notification-received'
  | 'theme-changed'

type EventListener<T = any> = (data: T) => void

class EventBus {
  private listeners = new Map<EventType, Set<EventListener>>()
  
  // イベントリスナーの登録
  on<T>(event: EventType, listener: EventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(listener)
    
    // クリーンアップ関数を返す
    return () => {
      this.listeners.get(event)?.delete(listener)
    }
  }
  
  // イベントの発火
  emit<T>(event: EventType, data?: T): void {
    const eventListeners = this.listeners.get(event)
    if (!eventListeners) return
    
    eventListeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    })
  }
  
  // 全リスナーの削除
  removeAllListeners(event?: EventType): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }
}

export const eventBus = new EventBus()

// 便利なフック
export function useEventListener<T>(
  event: EventType, 
  listener: EventListener<T>
) {
  useEffect(() => {
    return eventBus.on(event, listener)
  }, [event, listener])
}
```

## 🎨 UIパターン

### 8. Polymorphic Component Pattern (ポリモーフィックコンポーネント)

#### 概要
単一のコンポーネントが複数の要素タイプとして機能できるパターン。
型安全性を保ちながら、柔軟なAPIを提供します。

```typescript
// src/components/Text.tsx

type TextProps<T extends React.ElementType = 'span'> = {
  as?: T
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
} & Omit<React.ComponentPropsWithoutRef<T>, keyof TextProps>

export function Text<T extends React.ElementType = 'span'>({
  as,
  size = 'md',
  weight = 'normal',
  color = 'primary',
  style,
  ...props
}: TextProps<T>) {
  const Component = as || 'span'
  
  return (
    <Component
      style={[
        styles.text,
        styles[size],
        styles[weight],
        styles[color],
        style,
      ]}
      {...props}
    />
  )
}

// 使用例
<Text as="h1" size="xl" weight="bold">タイトル</Text>
<Text as="p" size="md" color="secondary">本文</Text>
<Text as="button" onPress={() => {}}>ボタン</Text>
```

このガイドにより、Blueskyで使用されている実践的なReactパターンを深く理解し、
大規模アプリケーション開発でのベストプラクティスを学習できます。