const UA = "mrfentmen-emoji-mcp/1.0"
export class EmojiError extends Error {}

// Compact catalog: keyword groups -> emoji characters.
const CATALOG: Record<string, string[]> = {
  smile: ["😀", "😁", "😂", "🤣", "😊", "😄", "😃", "🙂", "😉", "😍", "🥰", "😘"],
  heart: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💖", "💕", "💗"],
  sad: ["😢", "😭", "😞", "😔", "😟", "😩", "😫", "🥺", "😣", "😖"],
  angry: ["😡", "😠", "🤬", "😤", "😾"],
  animal: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🦄", "🐝", "🦋"],
  dog: ["🐶", "🦮", "🐕", "🐩"],
  cat: ["🐱", "🐈", "🐈‍⬛"],
  food: ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🍞", "🧀", "🍕", "🍔", "🍟", "🌭", "🍿", "🍩", "🍪", "🎂", "🍰", "🍫", "🍬"],
  fruit: ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝"],
  drink: ["☕", "🍵", "🧋", "🧃", "🥤", "🧉", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹"],
  coffee: ["☕", "🫖"],
  weather: ["☀️", "🌤️", "⛅", "🌥️", "☁️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "☃️", "💨", "🌪️", "🌈", "☔", "⚡"],
  sun: ["☀️", "🌞", "🌅", "🌄"],
  moon: ["🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "🌙", "🌚"],
  star: ["⭐", "🌟", "✨", "💫"],
  travel: ["✈️", "🚀", "🚗", "🚕", "🚌", "🚎", "🚓", "🚑", "🚒", "🚙", "🚚", "🚲", "🛵", "🏍️", "🚁", "🛸", "⛵", "🛳️"],
  rocket: ["🚀", "🛸", "🛰️"],
  car: ["🚗", "🚕", "🚙", "🚌", "🏎️", "🚓", "🚑", "🚒"],
  sport: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥊", "🥋", "⛳", "🏹", "🎳", "🏆", "🥇", "🥈", "🥉"],
  music: ["🎵", "🎶", "🎼", "🎤", "🎧", "🎷", "🎺", "🎸", "🎻", "🥁", "🎹"],
  phone: ["📱", "📲", "☎️", "📞", "📟"],
  computer: ["💻", "🖥️", "⌨️", "🖱️", "🖨️", "💾", "💿", "📀"],
  money: ["💰", "💵", "💶", "💷", "💴", "🪙", "💳", "🧾"],
  fire: ["🔥", "🧨"],
  love: ["❤️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "🥰", "😍"],
  party: ["🎉", "🎊", "🎈", "🎂", "🥳", "🎁", "🪅"],
  sleep: ["😴", "💤", "🛌", "🌙"],
  thinking: ["🤔", "🧐", "🤨", "💭"],
  cool: ["😎", "🕶️", "😏", "🤙"],
  hand: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "👏", "🙌", "🙏", "🤝", "💪"],
  flag: ["🏁", "🚩", "🎌", "🏳️", "🏴"],
  christmas: ["🎄", "🎅", "🤶", "🧑‍🎄", "❄️", "⛄"],
  halloween: ["🎃", "👻", "💀", "☠️", "🧛", "🧟"],
}

export async function search(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim().toLowerCase()
  if (!q) throw new EmojiError("Provide a keyword like smile or heart")
  const limit = Math.min(args.limit ?? 20, 60)
  const keys = Object.keys(CATALOG).filter((k) => k.includes(q) || q.includes(k))
  if (!keys.length) return `No emoji found for "${q}"`
  const seen = new Set<string>()
  const out: string[] = []
  for (const key of keys) {
    for (const e of CATALOG[key]) {
      if (!seen.has(e)) { seen.add(e); out.push(e) }
      if (out.length >= limit) break
    }
    if (out.length >= limit) break
  }
  return `Emoji for "${q}" (${out.length}):\n${out.join(" ")}`
}

export async function categories(args: Record<string, never>): Promise<string> {
  return `Emoji categories (${Object.keys(CATALOG).length}):\n${Object.keys(CATALOG).sort().join(", ")}`
}

// ---- muxA tools:
// The existing tools search the catalogue and list its group names. These work
// the other way round, from one emoji back to the groups that hold it, and
// total the catalogue up. Both are pure computation on the local catalogue.
export interface EmojiInfoArgs {
  emoji: string;
}

