// RAWGのジャンルslug → 日本語マッピング
const GENRE_MAP: Record<string, string> = {
  'action':                      'アクション',
  'indie':                       'インディー',
  'adventure':                   'アドベンチャー',
  'role-playing-games-rpg':      'RPG',
  'strategy':                    'ストラテジー',
  'shooter':                     'シューター',
  'casual':                      'カジュアル',
  'simulation':                  'シミュレーション',
  'puzzle':                      'パズル',
  'arcade':                      'アーケード',
  'platformer':                  'プラットフォーマー',
  'massively-multiplayer':       'MMO',
  'racing':                      'レーシング',
  'sports':                      'スポーツ',
  'fighting':                    '格闘',
  'family':                      'ファミリー',
  'board-games':                 'ボードゲーム',
  'educational':                 '教育',
  'card':                        'カードゲーム',
}

export type RawgGame = {
  rawgId: number
  title: string
  coverImageUrl: string | null
  genre: string | null
}

// ひらがな・カタカナ・漢字が含まれるかどうかの判定用
const JAPANESE_REGEX = /[぀-ヿ㐀-鿿]/

// 日本語タイトルをWikipedia APIで検索し、対応する英語版タイトルを取得する
// （RAWGは英語タイトルがメインキーのため、日本語のままだとヒットしにくい）
// 見つからない場合はnullを返す（呼び出し側で元の入力にフォールバック）
async function translateJapaneseTitle(query: string): Promise<string | null> {
  try {
    const url = `https://ja.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=langlinks&lllang=en&format=json&origin=*`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null

    const data = await res.json()
    const pages = data.query?.pages
    if (!pages) return null

    const page = Object.values(pages)[0] as { langlinks?: { '*': string }[] } | undefined
    const enTitle = page?.langlinks?.[0]?.['*']
    if (!enTitle) return null

    // Wikipediaの曖昧さ回避表記「(video game)」等の括弧書きを除去
    return enTitle.replace(/\s*\([^)]*\)\s*$/, '').trim()
  } catch {
    return null
  }
}

// rawgId からゲームの説明文（英語プレーンテキスト）を取得する
// 取得できない場合は null を返す（Gemini へのフォールバック用）
export async function getGameDescription(rawgId: number): Promise<string | null> {
  const apiKey = process.env.RAWG_API_KEY
  if (!apiKey) return null

  try {
    const url = `https://api.rawg.io/api/games/${rawgId}?key=${apiKey}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null

    const data = await res.json()
    // description_raw はHTMLタグなしのプレーンテキスト
    const text: string = data.description_raw ?? ''
    return text.trim() || null
  } catch {
    return null
  }
}

// ゲームタイトルで検索して上位pageSize件を返す（デフォルト5件、最大20件）
export async function searchGames(query: string, pageSize = 5): Promise<RawgGame[]> {
  const apiKey = process.env.RAWG_API_KEY
  if (!apiKey) throw new Error('RAWG_API_KEY が設定されていません')

  // 日本語タイトルはWikipedia経由で英語タイトルに変換してから検索する
  let searchQuery = query
  if (JAPANESE_REGEX.test(query)) {
    const translated = await translateJapaneseTitle(query)
    if (translated) searchQuery = translated
  }

  const clampedPageSize = Math.min(Math.max(pageSize, 1), 20)
  const url = `https://api.rawg.io/api/games?search=${encodeURIComponent(searchQuery)}&page_size=${clampedPageSize}&key=${apiKey}`
  const res = await fetch(url, { next: { revalidate: 3600 } })

  if (!res.ok) throw new Error(`RAWG API エラー: ${res.status}`)

  const data = await res.json()

  return (data.results ?? []).map((game: {
    id: number
    name: string
    background_image: string | null
    genres: { slug: string }[]
  }) => ({
    rawgId: game.id,
    title: game.name,
    coverImageUrl: game.background_image ?? null,
    // 最初のジャンルを日本語に変換。マッピングにない場合は英語のまま
    genre: game.genres[0]
      ? (GENRE_MAP[game.genres[0].slug] ?? game.genres[0].slug)
      : null,
  }))
}
