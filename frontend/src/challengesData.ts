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
    instructions: `緑の旗を押したらその場で「こんにちは！」と言わせよう。右にも上にも動かさず、あいさつだけでOK。`,
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
      'ねこを右へ何回か進ませてゴールについたことを報告しよう。',
    difficulty: '入門',
    image: 'images/sum_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗のあと、右に3回進んでゴールし、「着いたよ！」と伝えよう。上には動かさないでOK。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 3,
          moveTotal: 3,
          messageIncludes: '着いたよ！'
        }
      }
    ]
  },
  {
    id: 'scratch-jump',
    title: 'ジャンプで着地しよう',
    description:
      'ジャンプして「ジャンプ成功！」と言わせよう。',
    difficulty: '初級',
    image: 'images/reverse_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗のあと、「ジャンプする」を2回使ってから「ジャンプ成功！」と言わせよう。右には動かさなくてOK。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          jumpCount: 2,
          messageIncludes: 'ジャンプ成功！'
        }
      }
    ]
  },
  {
    id: 'scratch-control-loop',
    title: 'くり返しでゴールを見つけよう',
    description:
      'for 文のブロックを使って、右へ決まった回数だけ進み、条件付きで報告してみよう。',
    difficulty: '初級',
    image: 'images/character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗のあと、くり返しブロックで右へ4回進み、最後に「ゴールした？」で判定してゴールできたら「着いたよ！」と報告しよう。上方向には動かさない。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 4,
          moveTotal: 4,
          messageIncludes: '着いたよ！',
          lastMessage: '着いたよ！'
        }
      }
    ]
  },
  {
    id: 'scratch-boss-run',
    title: 'ゴールまで一気にダッシュ！',
    description:
      '右へ大きく進みながら途中でジャンプし、ゴールしたかを確認しよう。',
    difficulty: '中級',
    image: 'images/reverse_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗のあと、右に6回進み、途中で「ジャンプする」を2回使ってから「ゴールした？」で判定し、ゴールできたら「着いたよ！」とメッセージを出そう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 6,
          moveTotal: 6,
          jumpCount: 2,
          messageIncludes: '着いたよ！',
          lastMessage: '着いたよ！'
        }
      }
    ]
  },
  {
    id: 'scratch-checkpoint-report',
    title: '途中報告しながらゴールしよう',
    description:
      '右に進んであいさつし、ジャンプしたあとゴールできたことを報告しよう。',
    difficulty: '中級',
    image: 'images/sum_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗のあと、右に進んで「こんにちは！」と言い、「ジャンプする」を1回使おう。その後はくり返しで右へ進み、最後に「ゴールした？」でゴールできたら「着いたよ！」と報告しよう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 4,
          moveTotal: 4,
          jumpCount: 1,
          messageIncludes: 'こんにちは！',
          lastMessage: '着いたよ！'
        }
      }
    ]
  },
  {
    id: 'scratch-double-jump-guard',
    title: '二段ジャンプでゴール確認',
    description:
      '右へ進んでからジャンプして、ゴールしたかを最後にチェックしよう。',
    difficulty: '上級',
    image: 'images/reverse_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗のあと、右に2回進んでから「ジャンプする」を2回使い、続けてくり返しで右へ進み、最後は「ゴールした？」で確認し、着いたら「着いたよ！」と報告しよう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 5,
          moveTotal: 5,
          jumpCount: 2,
          messageIncludes: '着いたよ！',
          lastMessage: '着いたよ！'
        }
      }
    ]
  },
  {
    id: 'scratch-jump-landing',
    title: '二段ジャンプで着地！',
    description:
      'その場で2回ジャンプしてから、成功メッセージを出そう。',
    difficulty: '初級',
    image: 'images/character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗のあと、「ジャンプする」を2回使ってから「ジャンプ成功！」と言わせよう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          jumpCount: 2,
          messageIncludes: 'ジャンプ成功！',
          lastMessage: 'ジャンプ成功！'
        }
      }
    ]
  },
  {
    id: 'scratch-speed-run',
    title: 'スプリント',
    description:
      '右にしっかり進んで、ゴール判定でメッセージを出そう。',
    difficulty: '初級',
    image: 'images/sum_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗のあと、くり返しで右へ進み、上方向には動かさず「ゴールした？」でゴールできたら「着いたよ！」と伝えよう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 5,
          moveTotal: 5,
          messageIncludes: '着いたよ！',
          lastMessage: '着いたよ！'
        }
      }
    ]
  },
  {
    id: 'scratch-mini-steps',
    title: 'こまかく進もう',
    description:
      '小さい動きを重ねて進み、到着を報告しよう。',
    difficulty: '入門',
    image: 'images/character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗のあと、小さく右に進み続けてゴールし、上は動かさず「着いたよ！」と言わせよう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 1,
          moveTotal: 1,
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
    instructions: `緑の旗のあと、まず「こんにちは！」と言い、「ジャンプする」を1回使って最後に「ジャンプ成功！」と言おう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          jumpCount: 1,
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
      '大きな前進と小さな前進を組み合わせて進もう。',
    difficulty: '初級',
    image: 'images/sum_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Scratch'],
    instructions: `緑の旗のあと、大きく右に進むくり返しと小さく右に進むくり返しをつなげて、上には動かさずゴールを目指そう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 3,
          moveTotal: 3
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
    instructions: `緑の旗を押したら、右に進んで「こんにちは！」と言い、「ジャンプする」を1回使おう。その後くり返しで右へ進み、最後に「ゴールした？」でゴールできたら「着いたよ！」と伝えよう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 4,
          moveTotal: 4,
          jumpCount: 1,
          messageIncludes: 'こんにちは！',
          lastMessage: '着いたよ！'
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
    instructions: `右へ進んでから二段ジャンプで高く上がり、着地したあと、くり返しで右に進んでゴールへ。最後は「ゴールした？」の中で「ジャンプ成功！」と言って、ゴール時だけ報告しよう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 5,
          moveTotal: 5,
          jumpCount: 2,
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
    instructions: `2つのループを連続で使い、右へ長く進んでゴールを目指し、最後に「ゴールした？」でゴールできたら「着いたよ！」とメッセージを出そう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 8,
          moveTotal: 8,
          messageIncludes: '着いたよ！',
          lastMessage: '着いたよ！'
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
    instructions: `くり返しで右へ進んだあと、「こんにちは！」と言ってジャンプし、必ず着地してから「ゴールした？」で着いたか判定し、「着いたよ！」と報告しよう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 4,
          moveTotal: 4,
          jumpCount: 1,
          messageIncludes: 'こんにちは！',
          lastMessage: '着いたよ！'
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
    instructions: `細かい前進とくり返しの前進をつなげ、ジャンプで一度上がって戻ったあと、「ゴールした？」でゴールできたら「着いたよ！」だけが出るように仕上げよう。`,
    examples: '',
    video: '',
    testCases: [
      {
        input: [{}],
        expected: {
          x: 5,
          moveTotal: 5,
          jumpCount: 1,
          lastMessage: '着いたよ！'
        }
      }
    ]
  }
];
