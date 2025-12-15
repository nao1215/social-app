/**
 * @file Forms.tsx - フォームコンポーネントのカタログ
 * @description テキスト入力、トグル、日付選択などフォーム要素のStorybook画面
 *
 * ## Goエンジニア向けの説明
 * - React.useState: フォームの状態管理（Goの構造体フィールドに相当）
 * - React.useRef: DOM要素への参照（GoのポインタでHTML要素を参照するような感覚）
 * - Compound Component: TextField.Root + TextField.Input のような親子関係パターン
 * - 制御コンポーネント: 状態と onChange でフォームの値を管理
 *
 * ## 表示されるコンポーネント
 * - TextField: テキスト入力（アイコン付き、バリデーションエラー状態、サフィックス）
 * - Textarea: 複数行テキスト入力
 * - DateField: 日付選択
 * - Toggle: スイッチ、チェックボックス、ラジオボタン
 * - ToggleButton: グループ化されたトグルボタン
 *
 * ## アーキテクチャ
 * - 各フォームコンポーネントの状態を useState で管理
 * - maxSelections で最大選択数を制限（複数選択トグル）
 * - disabled, isInvalid プロパティで状態バリエーション表示
 *
 * @module view/screens/Storybook/Forms
 */

// Reactコアライブラリ
import React from 'react'
// React Nativeの型定義とコンポーネント
import {type TextInput, View} from 'react-native'

// デザインシステムのスタイルプリミティブ
import {atoms as a} from '#/alf'
// ボタンコンポーネント
import {Button, ButtonText} from '#/components/Button'
// 日付入力フィールド
import {DateField, LabelText} from '#/components/forms/DateField'
// テキスト入力フィールド群（Compound Component）
import * as TextField from '#/components/forms/TextField'
// トグルコンポーネント群（チェックボックス、スイッチ、ラジオ）
import * as Toggle from '#/components/forms/Toggle'
// トグルボタングループ
import * as ToggleButton from '#/components/forms/ToggleButton'
// アイコンコンポーネント
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
// 見出しコンポーネント
import {H1, H3} from '#/components/Typography'

/**
 * Forms - フォームコンポーネントのカタログ表示
 *
 * テキスト入力、トグル、日付選択など全てのフォームバリエーションと
 * 状態（disabled, invalid, 選択数制限）を視覚的に確認できる
 */
export function Forms() {
  const [toggleGroupAValues, setToggleGroupAValues] = React.useState(['a'])
  const [toggleGroupBValues, setToggleGroupBValues] = React.useState(['a', 'b'])
  const [toggleGroupCValues, setToggleGroupCValues] = React.useState(['a', 'b'])
  const [toggleGroupDValues, setToggleGroupDValues] = React.useState(['warn'])

  const [value, setValue] = React.useState('')
  const [date, setDate] = React.useState('2001-01-01')

  const inputRef = React.useRef<TextInput>(null)

  return (
    <View style={[a.gap_4xl, a.align_start]}>
      <H1>Forms</H1>

      <View style={[a.gap_md, a.align_start, a.w_full]}>
        <H3>InputText</H3>

        <TextField.Input
          value={value}
          onChangeText={setValue}
          label="Text field"
        />

        <View style={[a.flex_row, a.align_start, a.gap_sm]}>
          <View style={[a.flex_1]}>
            <TextField.Root>
              <TextField.Icon icon={Globe} />
              <TextField.Input
                inputRef={inputRef}
                value={value}
                onChangeText={setValue}
                label="Text field"
              />
            </TextField.Root>
          </View>
          <Button
            label="Submit"
            size="large"
            variant="solid"
            color="primary"
            onPress={() => inputRef.current?.clear()}>
            <ButtonText>Submit</ButtonText>
          </Button>
        </View>

        <TextField.Root>
          <TextField.Icon icon={Globe} />
          <TextField.Input
            value={value}
            onChangeText={setValue}
            label="Text field"
          />
        </TextField.Root>

        <TextField.Root>
          <TextField.Icon icon={Globe} />
          <TextField.Input
            value={value}
            onChangeText={setValue}
            label="Text field"
            isInvalid
          />
        </TextField.Root>

        <View style={[a.w_full]}>
          <TextField.LabelText>Text field</TextField.LabelText>
          <TextField.Root>
            <TextField.Icon icon={Globe} />
            <TextField.Input
              value={value}
              onChangeText={setValue}
              label="Text field"
            />
            <TextField.SuffixText label="@gmail.com">
              @gmail.com
            </TextField.SuffixText>
          </TextField.Root>
        </View>

        <View style={[a.w_full]}>
          <TextField.LabelText>Textarea</TextField.LabelText>
          <TextField.Input
            multiline
            numberOfLines={4}
            value={value}
            onChangeText={setValue}
            label="Text field"
          />
        </View>

        <H3>DateField</H3>

        <View style={[a.w_full]}>
          <LabelText>Date</LabelText>
          <DateField
            testID="date"
            value={date}
            onChangeDate={date => {
              console.log(date)
              setDate(date)
            }}
            label="Input"
          />
        </View>
      </View>

      <View style={[a.gap_md, a.align_start, a.w_full]}>
        <H3>Toggles</H3>

        <Toggle.Item name="a" label="Click me">
          <Toggle.Checkbox />
          <Toggle.LabelText>Uncontrolled toggle</Toggle.LabelText>
        </Toggle.Item>

        <Toggle.Group
          label="Toggle"
          type="checkbox"
          maxSelections={2}
          values={toggleGroupAValues}
          onChange={setToggleGroupAValues}>
          <View style={[a.gap_md]}>
            <Toggle.Item name="a" label="Click me">
              <Toggle.Switch />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="b" label="Click me">
              <Toggle.Switch />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="c" label="Click me">
              <Toggle.Switch />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="d" disabled label="Click me">
              <Toggle.Switch />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="e" isInvalid label="Click me">
              <Toggle.Switch />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
          </View>
        </Toggle.Group>

        <Toggle.Group
          label="Toggle"
          type="checkbox"
          maxSelections={2}
          values={toggleGroupBValues}
          onChange={setToggleGroupBValues}>
          <View style={[a.gap_md]}>
            <Toggle.Item name="a" label="Click me">
              <Toggle.Checkbox />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="b" label="Click me">
              <Toggle.Checkbox />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="c" label="Click me">
              <Toggle.Checkbox />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="d" disabled label="Click me">
              <Toggle.Checkbox />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="e" isInvalid label="Click me">
              <Toggle.Checkbox />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
          </View>
        </Toggle.Group>

        <Toggle.Group
          label="Toggle"
          type="radio"
          values={toggleGroupCValues}
          onChange={setToggleGroupCValues}>
          <View style={[a.gap_md]}>
            <Toggle.Item name="a" label="Click me">
              <Toggle.Radio />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="b" label="Click me">
              <Toggle.Radio />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="c" label="Click me">
              <Toggle.Radio />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="d" disabled label="Click me">
              <Toggle.Radio />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="e" isInvalid label="Click me">
              <Toggle.Radio />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
          </View>
        </Toggle.Group>
      </View>

      <Button
        variant="solid"
        color="primary"
        size="small"
        label="Reset all toggles"
        onPress={() => {
          setToggleGroupAValues(['a'])
          setToggleGroupBValues(['a', 'b'])
          setToggleGroupCValues(['a'])
        }}>
        <ButtonText>Reset all toggles</ButtonText>
      </Button>

      <View style={[a.gap_md, a.align_start, a.w_full]}>
        <H3>ToggleButton</H3>

        <ToggleButton.Group
          label="Preferences"
          values={toggleGroupDValues}
          onChange={setToggleGroupDValues}>
          <ToggleButton.Button name="hide" label="Hide">
            <ToggleButton.ButtonText>Hide</ToggleButton.ButtonText>
          </ToggleButton.Button>
          <ToggleButton.Button name="warn" label="Warn">
            <ToggleButton.ButtonText>Warn</ToggleButton.ButtonText>
          </ToggleButton.Button>
          <ToggleButton.Button name="show" label="Show">
            <ToggleButton.ButtonText>Show</ToggleButton.ButtonText>
          </ToggleButton.Button>
        </ToggleButton.Group>

        <View>
          <ToggleButton.Group
            label="Preferences"
            values={toggleGroupDValues}
            onChange={setToggleGroupDValues}>
            <ToggleButton.Button name="hide" label="Hide">
              <ToggleButton.ButtonText>Hide</ToggleButton.ButtonText>
            </ToggleButton.Button>
            <ToggleButton.Button name="warn" label="Warn">
              <ToggleButton.ButtonText>Warn</ToggleButton.ButtonText>
            </ToggleButton.Button>
            <ToggleButton.Button name="show" label="Show">
              <ToggleButton.ButtonText>Show</ToggleButton.ButtonText>
            </ToggleButton.Button>
          </ToggleButton.Group>
        </View>
      </View>
    </View>
  )
}
