import { Challenge } from './types/challenge';

export const challengesData: Challenge[] = [
  {
    id: 'scratch-greeting',
    title: 'ねこにあいさつさせよう',
    description:
      '緑の旗を押したらねこが「こんにちは！」と言うようにブロックを並べてみましょう。',
    difficulty: '入門',
    image: 'images/character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗を押したら、ねこが「こんにちは！」とあいさつするスクリプトを作ろう。

【ポイント】
・イベントカテゴリの「⚑ が押されたとき」をいちばん上に置く
・見た目カテゴリの「「～」と言う」でセリフを設定する`,
    examples: `例のブロック並び:
1. ⚑ が押されたとき
2. 「こんにちは！」と言う`,
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          messageIncludes: 'こんにちは！',
          lastMessage: 'こんにちは！'
        }
      }
    ]
  },
  {
    id: 'scratch-walk',
    title: 'おさんぽチャレンジ',
    description:
      'ねこを合計30歩前に進ませて、ゴールについたことを報告しよう。',
    difficulty: '入門',
    image: 'images/sum_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗を押したら合計30歩うごかして「着いたよ！」と言ってみよう。

【ポイント】
・モーション「～歩うごかす」を組み合わせて合計30にする
・最後に「着いたよ！」と言う`,
    examples: `例のブロック並び:
1. ⚑ が押されたとき
2. 10歩うごかす
3. 10歩うごかす
4. 10歩うごかす
5. 「着いたよ！」と言う`,
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 30,
          moveTotal: 30,
          messageIncludes: '着いたよ！'
        }
      }
    ]
  },
  {
    id: 'scratch-jump',
    title: 'ジャンプで着地しよう',
    description:
      'ジャンプして地面に戻ってきたら「ジャンプ成功！」と言わせよう。',
    difficulty: '初級',
    image: 'images/reverse_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗を押したら、上に50上がって、地面(y=0)に戻り、「ジャンプ成功！」と言わせよう。

【ポイント】
・「y座標を〜ずつ変える」でジャンプ
・「y座標を〜にする」で元の位置へ戻す
・最後にセリフを追加`,
    examples: `例のブロック並び:
1. ⚑ が押されたとき
2. y座標を 50 ずつ変える
3. y座標を 0 にする
4. 「ジャンプ成功！」と言う`,
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          maxY: 50,
          y: 0,
          messageIncludes: 'ジャンプ成功！'
        }
      }
    ]
  },
  {
    id: 'scratch-control-loop',
    title: 'くり返しでゴールを見つけよう',
    description:
      'for 文のブロックを使って、ゴール地点(40歩)まで進み、条件付きで報告してみよう。',
    difficulty: '初級',
    image: 'images/character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗を押したら、コントロールカテゴリのブロックでゴールまで進もう。

【ポイント】
・「for (回数を選んでくり返す)」の下に「10歩うごかす」をインデントして入れよう（回数欄で 4 を選ぼう。終わりは自動で閉じるよ）
・「もし [条件] なら」のドロップダウンから「ゴールした？」を選んでみよう
・条件が真になったら「着いたよ！」と言わせたり、空にして自動メッセージでも OK`,
    examples: `例のブロック並び:
1. ⚑ が押されたとき
2. for (回数を選んでくり返す)  ※回数は 4
   - 10歩うごかす
3. もし [条件] なら（条件: ゴールした？）
   - 「ゴールできたよ！」と言う`,
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 40,
          moveTotal: 40,
          messageIncludes: 'ゴールできたよ！',
          lastMessage: 'ゴールできたよ！'
        }
      }
    ]
  }
];
