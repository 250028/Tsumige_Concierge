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

// ゲームタイトルで検索して上位5件を返す
export async function searchGames(query: string): Promise<RawgGame[]> {
  const apiKey = process.env.RAWG_API_KEY
  if (!apiKey) throw new Error('RAWG_API_KEY が設定されていません')

  const url = `https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&page_size=5&key=${apiKey}`
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
