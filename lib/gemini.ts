import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' })

// ゲーム情報の型（プロンプト生成用）
type GameInfo = {
  title: string
  genre: string | null
  platform: string | null
  status: string
  lastPlayedAt: Date | null
  progressNote: string | null
}

// 開発中にAPIを呼ばずダミーテキストを返すモードフラグ
const IS_MOCK = process.env.MOCK_AI === 'true'

/**
 * 「今日の1本」のおすすめ理由を生成する
 * ゲーム1本の情報を渡すと、コンシェルジュ視点の一言コメントを返す
 */
export async function generateRecommendReason(game: GameInfo): Promise<string> {
  if (IS_MOCK) {
    return `【開発モック】${game.title} は長らく積まれたままですね。今日こそ封を切ってみませんか？きっと新しい発見がありますよ。`
  }
  const lastPlayed = game.lastPlayedAt
    ? `最後にプレイしたのは ${game.lastPlayedAt.toLocaleDateString('ja-JP')} です。`
    : '一度もプレイしていません。'

  const prompt = `
あなたは積みゲー消化を応援する優しいコンシェルジュです。
以下のゲームを「今日やるべき1本」としておすすめする理由を、
プレイヤーのやる気が出るよう、親しみやすい日本語で2〜3文で書いてください。
情報が不確かな場合は推測せず、分かる情報だけで自然にまとめてください。

ゲームタイトル: ${game.title}
ジャンル: ${game.genre ?? '不明'}
プラットフォーム: ${game.platform ?? '不明'}
ステータス: ${game.status}
${lastPlayed}
進捗メモ: ${game.progressNote ?? 'なし'}
`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

/**
 * ゲーム詳細ページ用：「ここが面白い！」モチベーターコメントを生成する
 */
export async function generateMotivator(game: GameInfo): Promise<string> {
  if (IS_MOCK) {
    return `【開発モック】${game.title} は独特の世界観が魅力です。まずは最初の1時間だけ試してみてください！`
  }

  const prompt = `
あなたは積みゲー消化を応援する優しいコンシェルジュです。
以下のゲームについて「ここが面白い！やる気が出る！」という視点で、
プレイヤーのモチベーションが上がるよう親しみやすい日本語で2〜3文で書いてください。
情報が不確かな場合は推測せず、分かる情報だけで自然にまとめてください。

ゲームタイトル: ${game.title}
ジャンル: ${game.genre ?? '不明'}
プラットフォーム: ${game.platform ?? '不明'}
ステータス: ${game.status}
進捗メモ: ${game.progressNote ?? 'なし'}
`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

/**
 * ユーザーのメッセージと積みゲーリストを受け取り、チャット返答を生成する
 * ペルソナ: butler（執事）/ gamer（ゲーマー仲間）/ fairy（ゲームの妖精）
 */
export async function generateChatReply(
  userMessage: string,
  games: GameInfo[],
  persona: 'butler' | 'gamer' | 'fairy' = 'butler'
): Promise<string> {
  if (IS_MOCK) {
    const titles = games.map(g => g.title).slice(0, 2).join('、') || 'ゲーム'
    return `【開発モック】「${userMessage}」ですね。積みゲーの中から ${titles} などいかがでしょうか。気分に合いそうですよ！`
  }
  const personaPrompt = {
    butler: 'あなたは丁寧で知的な執事コンシェルジュです。敬語で落ち着いた口調で話します。',
    gamer: 'あなたはノリのいいゲーマー仲間です。フレンドリーでテンション高めに話します。',
    fairy: 'あなたは不思議でかわいいゲームの妖精です。独特の言い回しで楽しく話します。',
  }

  const gameList = games
    .map(g => `・${g.title}（${g.genre ?? '不明'} / ${g.platform ?? '不明'} / ${g.status}）`)
    .join('\n')

  const prompt = `
${personaPrompt[persona]}
ユーザーの積みゲーリストを参考に、ゲームのおすすめや質問に答えてください。
情報が不確かな場合は「情報が不確かです」と正直に伝えてください。
返答は日本語で、3〜5文程度にまとめてください。

【積みゲーリスト】
${gameList || 'まだ登録されていません。'}

【ユーザーのメッセージ】
${userMessage}
`

  const result = await model.generateContent(prompt)
  return result.response.text()
}
