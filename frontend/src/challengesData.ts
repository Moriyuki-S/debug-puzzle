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
    examples: '',
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
    examples: '',
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
    examples: '',
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
    examples: '',
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
  },
  {
    id: 'scratch-boss-run',
    title: 'ゴールまで一気にダッシュ！',
    description:
      '連続ジャンプとループを組み合わせて、最短手数でゴールにたどり着こう。',
    difficulty: '中級',
    image: 'images/reverse_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗を押したら、まとめて60歩進み、ジャンプを2回してから着地し、最後にゴールメッセージを出そう。

【ポイント】
・forブロックで「10歩うごかす」を6回まとめて実行しよう
・ジャンプは「y座標を 50 ずつ変える」を2回、その後「y座標を 0 にする」で着地
・条件ブロックは「ゴールした？」を選ぶと自動で「ゴールできたよ！」と言ってくれるよ
・ダミーブロック（光るボタン/くるくる回る）は今回は使わなくてOK`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 60,
          moveTotal: 60,
          maxY: 100,
          y: 0,
          messageIncludes: 'ゴールできたよ！',
          lastMessage: 'ゴールできたよ！'
        }
      }
    ]
  },
  {
    id: 'scratch-checkpoint-report',
    title: '途中報告しながらゴールしよう',
    description:
      '小さく動きながらあいさつし、ジャンプで段差を越えつつゴールできたことを報告しよう。',
    difficulty: '中級',
    image: 'images/sum_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗を押したら、次の順番で進めよう。

【ポイント】
・まず小さく1歩(3歩うごかす)動いてから「こんにちは！」と言う
・for (回数を選んでくり返す) で合計40歩進むように中に「10歩うごかす」を入れる（回数は4）
・途中で1回ジャンプして(maxYを50にする)、着地してから条件のメッセージを出す
・「もし [条件] なら」で「ゴールした？」を選び、最後のメッセージを「ゴールできたよ！」にしよう`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 43,
          moveTotal: 43,
          maxY: 50,
          y: 0,
          messageIncludes: 'こんにちは！',
          lastMessage: 'ゴールできたよ！'
        }
      }
    ]
  },
  {
    id: 'scratch-double-jump-guard',
    title: '二段ジャンプでゴール確認',
    description:
      '二段ジャンプで高い段差を越えつつ、ゴールしたかを最後にチェックしよう。',
    difficulty: '上級',
    image: 'images/reverse_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗を押したら、二段ジャンプで高所を越え、着地後にゴール判定をしよう。

【ポイント】
・最初に小刻みな前進（3歩うごかすを2回など）でウォームアップ
・ジャンプは「y座標を 50 ずつ変える」を2回続けて、高さ100を記録したら「y座標を 0 にする」で必ず着地する
・for (回数を選んでくり返す) の中に「10歩うごかす」を入れ、合計でゴール(x>=40)に届かせる
・「もし [条件] なら」で「ゴールした？」を選び、最後のメッセージを「ゴールできたよ！」にしよう`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 46,
          moveTotal: 46,
          maxY: 100,
          y: 0,
          messageIncludes: 'ゴールできたよ！',
          lastMessage: 'ゴールできたよ！'
        }
      }
    ]
  },
  {
    id: 'scratch-jump-landing',
    title: '二段ジャンプで着地！',
    description:
      'ジャンプを2回してから地面に戻り、成功メッセージを出そう。',
    difficulty: '初級',
    image: 'images/character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗のあとにジャンプを2回してからy=0に戻し、「ジャンプ成功！」と言わせよう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          maxY: 100,
          y: 0,
          messageIncludes: 'ジャンプ成功！',
          lastMessage: 'ジャンプ成功！'
        }
      }
    ]
  },
  {
    id: 'scratch-speed-run',
    title: '50歩スプリント',
    description:
      'まとめて50歩進んで、ゴール判定でメッセージを出そう。',
    difficulty: '初級',
    image: 'images/sum_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `forブロックで「10歩うごかす」を5回くり返し、条件を「ゴールした？」にしてゴールメッセージを出そう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 50,
          moveTotal: 50,
          messageIncludes: 'ゴールできたよ！',
          lastMessage: 'ゴールできたよ！'
        }
      }
    ]
  },
  {
    id: 'scratch-mini-steps',
    title: 'こまかく歩こう',
    description:
      '小さい歩幅で合計12歩進み、到着を報告しよう。',
    difficulty: '入門',
    image: 'images/character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `「3歩うごかす」を4回くり返して合計12歩進み、最後に「着いたよ！」と言わせよう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 12,
          moveTotal: 12,
          lastMessage: '着いたよ！',
          messageIncludes: '着いたよ！'
        }
      }
    ]
  },
  {
    id: 'scratch-hello-jump',
    title: 'あいさつジャンプ',
    description:
      'あいさつしてからジャンプし、着地したらジャンプ成功を伝えよう。',
    difficulty: '入門',
    image: 'images/character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `最初に「こんにちは！」と言い、ジャンプでyを50上げてから0に戻し、最後に「ジャンプ成功！」と言おう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          maxY: 50,
          y: 0,
          messageIncludes: 'ジャンプ成功！',
          lastMessage: 'ジャンプ成功！'
        }
      }
    ]
  },
  {
    id: 'scratch-loop-mix',
    title: 'ミックスループチャレンジ',
    description:
      '大きな歩きと小さな歩きを組み合わせて合計29歩進もう。',
    difficulty: '初級',
    image: 'images/sum_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `forで「10歩うごかす」を2回くり返し、そのあと別のforで「3歩うごかす」を3回くり返してみよう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 29,
          moveTotal: 29
        }
      }
    ]
  },
  {
    id: 'scratch-greeting-checkpoint',
    title: 'あいさつしてから段差を超えよう',
    description:
      '小さく動いてあいさつし、ジャンプで段差を超えてからゴール判定をしよう。',
    difficulty: '中級',
    image: 'images/character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗を押したら、次の順で動かそう。

【ポイント】
・最初に「3歩うごかす」で少し進んでから「こんにちは！」と言う
・ジャンプは「y座標を 50 ずつ変える」→「y座標を 0 にする」で必ず着地
・for (回数を選んでくり返す) の中に「10歩うごかす」を入れてゴールに届かせる（回数は4）
・「もし [条件] なら」で「ゴールした？」を選び、最後は自動メッセージ「ゴールできたよ！」を出そう`,
    examples: `例のブロック並び:
1. ⚑ が押されたとき
2. 3歩うごかす
3. 「こんにちは！」と言う
4. y座標を 50 ずつ変える
5. y座標を 0 にする
6. for (4回くり返す)
   - 10歩うごかす
7. もし [条件] なら（条件: ゴールした？）`,
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 43,
          moveTotal: 43,
          maxY: 50,
          y: 0,
          messageIncludes: 'こんにちは！',
          lastMessage: 'ゴールできたよ！'
        }
      }
    ]
  },
  {
    id: 'scratch-double-jump-celebrate',
    title: '二段ジャンプで華麗にゴール',
    description:
      '二段ジャンプで高台を越え、ゴールしたときだけ「ジャンプ成功！」と報告しよう。',
    difficulty: '上級',
    image: 'images/reverse_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `二段ジャンプとループを組み合わせてゴールに届いたら、ジャンプ成功の報告だけを出そう。

【ポイント】
・「3歩うごかす」を2回入れてから動き出すと合計歩数を調整しやすい
・「y座標を 50 ずつ変える」を2回続けると高さ100に到達する。必ず「y座標を 0 にする」で着地
・for (回数を選んでくり返す) の中に「10歩うごかす」を入れて合計x座標を40以上にする（回数は4）
・「もし [条件] なら」で「ゴールした？」を選び、その中に「ジャンプ成功！」と言うを入れて、条件が真のときだけ報告を出そう（自動メッセージは使わない）`,
    examples: `例のブロック並び:
1. ⚑ が押されたとき
2. 3歩うごかす
3. 3歩うごかす
4. y座標を 50 ずつ変える
5. y座標を 50 ずつ変える
6. y座標を 0 にする
7. for (4回くり返す)
   - 10歩うごかす
8. もし [条件] なら（条件: ゴールした？）
   - 「ジャンプ成功！」と言う`,
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 46,
          moveTotal: 46,
          maxY: 100,
          y: 0,
          messageIncludes: 'ジャンプ成功！',
          lastMessage: 'ジャンプ成功！'
        }
      }
    ]
  },
  {
    id: 'scratch-two-loops-dash',
    title: '二本のループで大移動',
    description:
      'ループを2本つないで長距離ダッシュし、最後にゴールメッセージを出そう。',
    difficulty: '中級',
    image: 'images/sum_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `forブロックを2つ連続で使って長距離を移動しよう。

【ポイント】
・1本目のfor (回数を選んでくり返す) に「10歩うごかす」を入れる（回数は4）
・2本目も同じように配置して合計80歩進む
・途中で y座標 を必ず 0 に戻しておくと安全
・最後に「もし [条件] なら」で「ゴールした？」を選び、自動の「ゴールできたよ！」メッセージを出そう`,
    examples: `例のブロック並び:
1. ⚑ が押されたとき
2. for (4回くり返す)
   - 10歩うごかす
3. for (4回くり返す)
   - 10歩うごかす
4. もし [条件] なら（条件: ゴールした？）`,
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 80,
          moveTotal: 80,
          y: 0,
          messageIncludes: 'ゴールできたよ！',
          lastMessage: 'ゴールできたよ！'
        }
      }
    ]
  },
  {
    id: 'scratch-late-jump-check',
    title: '最後にジャンプして確認',
    description:
      'ゴール間際でジャンプしつつ、あいさつとゴール報告の順序を守ろう。',
    difficulty: '上級',
    image: 'images/character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `動きの順番を意識して、最後にジャンプとゴール確認を入れよう。

【ポイント】
・for (回数を選んでくり返す) の中で40歩進む（回数は4）
・その後で「こんにちは！」と言う
・ゴール間際に「y座標を 50 ずつ変える」でジャンプし、必ず「y座標を 0 にする」で着地
・「もし [条件] なら」で「ゴールした？」を選び、自動メッセージで締める`,
    examples: `例のブロック並び:
1. ⚑ が押されたとき
2. for (4回くり返す)
   - 10歩うごかす
3. 「こんにちは！」と言う
4. y座標を 50 ずつ変える
5. y座標を 0 にする
6. もし [条件] なら（条件: ゴールした？）`,
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 40,
          moveTotal: 40,
          maxY: 50,
          y: 0,
          messageIncludes: 'こんにちは！',
          lastMessage: 'ゴールできたよ！'
        }
      }
    ]
  },
  {
    id: 'scratch-zigzag-advance',
    title: 'こまめな前進とジャンプで突破',
    description:
      '小刻みな動きとジャンプを組み合わせ、余計なメッセージを出さずにゴールしよう。',
    difficulty: '中級',
    image: 'images/reverse_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `細かい動きとジャンプを組み合わせて、最後にだけゴール報告をしよう。

【ポイント】
・「3歩うごかす」を3回入れてから for (回数を選んでくり返す) に「10歩うごかす」を入れる（回数は4）
・「y座標を 50 ずつ変える」で一度ジャンプし、「y座標を 0 にする」で着地
・「もし [条件] なら」で「ゴールした？」を選び、余計なセリフは追加せず自動メッセージでゴール報告`,
    examples: `例のブロック並び:
1. ⚑ が押されたとき
2. 3歩うごかす
3. 3歩うごかす
4. 3歩うごかす
5. for (4回くり返す)
   - 10歩うごかす
6. y座標を 50 ずつ変える
7. y座標を 0 にする
8. もし [条件] なら（条件: ゴールした？）`,
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 49,
          moveTotal: 49,
          maxY: 50,
          y: 0,
          lastMessage: 'ゴールできたよ！'
        }
      }
    ]
  }
];
