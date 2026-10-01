const UA = "mrfentmen-wordle-helper-mcp/1.0"
export class WordleError extends Error {}

// A small bundled list of common 5 letter words for candidates.
const WORDS = [
  "about", "above", "abuse", "actor", "acute", "admit", "adopt", "adult", "after", "again",
  "agent", "agree", "ahead", "alarm", "album", "alert", "alien", "align", "alive", "allow",
  "alone", "along", "alter", "among", "anger", "angle", "angry", "apart", "apple", "apply",
  "arena", "argue", "arise", "array", "aside", "asset", "audio", "audit", "avoid", "award",
  "aware", "badly", "baker", "bases", "basic", "beach", "began", "begin", "being", "below",
  "bench", "billy", "birth", "black", "blade", "blame", "blank", "blast", "blaze", "bleed",
  "blend", "bless", "blind", "block", "blood", "bloom", "blown", "board", "boost", "booth",
  "bound", "brain", "brand", "brave", "bread", "break", "breed", "brief", "bring", "broad",
  "broke", "brown", "build", "built", "buyer", "cabin", "cable", "carry", "catch", "cause",
  "chain", "chair", "chaos", "charm", "chart", "chase", "cheap", "check", "cheek", "cheer",
  "chess", "chest", "chief", "child", "chill", "china", "choir", "chose", "civil", "claim",
  "class", "clean", "clear", "click", "climb", "clock", "close", "cloth", "cloud", "coach",
  "coast", "couch", "could", "count", "court", "cover", "crack", "craft", "crash", "crazy",
  "cream", "crime", "cross", "crowd", "crown", "crude", "cruel", "curve", "cycle", "daily",
  "dance", "dated", "dealt", "death", "debut", "delay", "depth", "doing", "doubt", "dozen",
  "draft", "drama", "drawn", "dream", "dress", "drill", "drink", "drive", "drove", "dying",
  "eager", "early", "earth", "eight", "elite", "empty", "enemy", "enjoy", "enter", "entry",
  "equal", "error", "event", "every", "exact", "exist", "extra", "faced", "facto", "faint",
  "faith", "false", "fault", "favor", "field", "fifth", "fifty", "fight", "final", "first",
  "fixed", "flame", "flash", "fleet", "flesh", "float", "floor", "fluid", "focus", "force",
  "forth", "forty", "forum", "found", "frame", "frank", "fraud", "fresh", "front", "fruit",
  "fully", "funny", "giant", "given", "glass", "globe", "going", "grace", "grade", "grand",
  "grant", "grass", "grave", "great", "green", "gross", "group", "grove", "grown", "guard",
  "guess", "guest", "guide", "guilt", "habit", "happy", "harry", "heart", "heavy", "hence",
  "hinge", "hobby", "honey", "honor", "horse", "hotel", "house", "human", "humor", "hurry",
  "ideal", "image", "imply", "index", "inner", "input", "issue", "joint", "jones", "judge",
  "juice", "known", "label", "large", "laser", "later", "laugh", "layer", "learn", "lease",
  "least", "leave", "legal", "lemon", "level", "light", "limit", "local", "logic", "loose",
  "lower", "lucky", "lunch", "lying", "magic", "major", "maker", "march", "match", "maybe",
  "mayor", "meant", "medal", "media", "mercy", "merit", "metal", "meter", "middle", "might",
  "minor", "minus", "mixed", "model", "money", "month", "moral", "motor", "mount", "mouse",
  "mouth", "movie", "music", "needs", "nerve", "never", "newly", "night", "noise", "north",
  "noted", "novel", "nurse", "occur", "ocean", "offer", "often", "order", "other", "ought",
  "ounce", "owner", "paint", "panel", "paper", "party", "peace", "pencil", "phase", "phone",
  "photo", "piano", "piece", "pilot", "pitch", "pizza", "place", "plain", "plane", "plant",
  "plate", "plaza", "point", "pound", "power", "press", "price", "pride", "prime", "print",
  "prior", "prize", "proof", "proud", "prove", "pulse", "punch", "pupil", "puppy", "purse",
  "queen", "query", "quest", "queue", "quick", "quiet", "quite", "quota", "quote", "raise",
  "range", "rapid", "ratio", "reach", "react", "ready", "refer", "relax", "reply", "rider",
  "ridge", "right", "rigid", "rinse", "risen", "risky", "rival", "river", "roast", "robot",
  "rough", "round", "route", "royal", "rural", "score", "screw", "sense", "serve", "seven",
  "shade", "shake", "shall", "shape", "share", "sharp", "sheep", "sheet", "shelf", "shell",
  "shift", "shine", "shirt", "shock", "shoot", "shore", "short", "shout", "shown", "sight",
  "since", "sixth", "sixty", "sized", "skill", "skirt", "slave", "sleep", "slice", "slide",
  "slope", "small", "smart", "smile", "smith", "smoke", "snake", "solid", "solve", "sorry",
  "sound", "south", "space", "spare", "speak", "speed", "spend", "spent", "split", "spoke",
  "sport", "staff", "stage", "stake", "stand", "start", "state", "steam", "steel", "stick",
  "still", "stock", "stone", "stood", "store", "storm", "story", "stove", "strap", "straw",
  "strip", "stuck", "study", "stuff", "style", "sugar", "suite", "sunny", "super", "sweet",
  "swift", "swing", "sword", "table", "taken", "taste", "taxes", "teach", "teeth", "thank",
  "theft", "their", "theme", "there", "these", "thick", "thing", "think", "third", "those",
  "three", "threw", "throw", "thumb", "tiger", "tight", "tired", "titan", "title", "today",
  "topic", "total", "touch", "tough", "tower", "track", "trade", "trail", "train", "trait",
  "treat", "trend", "trial", "tribe", "trick", "tried", "tries", "truck", "truly", "trunk",
  "trust", "truth", "twice", "twist", "types", "uncle", "under", "union", "until", "upper",
  "upset", "urban", "usage", "usual", "valid", "value", "video", "virus", "visit", "vital",
  "vocal", "voice", "voter", "waste", "watch", "water", "wheel", "where", "which", "while",
  "white", "whole", "whose", "woman", "women", "world", "worry", "worse", "worst", "worth",
  "would", "wound", "write", "wrong", "wrote", "yield", "young", "youth",
]

export async function suggest(args: Record<string, never>): Promise<string> {
  const ranked = [...WORDS].sort((a, b) => {
    const letters = new Set(a).size
    const bLetters = new Set(b).size
    if (letters !== bLetters) return bLetters - letters
    const score = (w: string) => {
      let s = 0
      for (const c of w) s += "eariotnslcudpmhgbfywkvxzjq".indexOf(c) === -1 ? 0 : 20 - "eariotnslcudpmhgbfywkvxzjq".indexOf(c)
      return s
    }
    return score(b) - score(a)
  })
  return `Suggested starting guesses:\n${ranked.slice(0, 5).join("\n")}`
}

export async function filter(args: { guesses?: string }): Promise<string> {
  const raw = (args.guesses ?? "").trim()
  if (!raw) throw new WordleError("Provide a JSON array of {word, marks} entries")
  let entries: Array<{ word: string; marks: string }>
  try {
    entries = JSON.parse(raw)
  } catch {
    throw new WordleError("guesses must be valid JSON like [{\"word\":\"crane\",\"marks\":\"gyxxy\"}]")
  }
  if (!Array.isArray(entries) || !entries.length) throw new WordleError("Provide at least one guess entry")
  const greens = new Map<number, string>()
  const yellows = new Map<string, number[]>()
  const grays = new Set<string>()
  for (const e of entries) {
    const word = (e.word ?? "").toLowerCase()
    const marks = (e.marks ?? "").toLowerCase()
    if (word.length !== 5 || marks.length !== 5) throw new WordleError("Each entry needs a 5 letter word and 5 marks")
    for (let i = 0; i < 5; i++) {
      const m = marks[i]
      const c = word[i]
      if (m === "g") greens.set(i, c)
      else if (m === "y") {
        const arr = yellows.get(c) ?? []
        arr.push(i)
        yellows.set(c, arr)
      } else if (m === "x") {
        // Only gray if the letter never appears green or yellow anywhere.
        if (![...greens.values()].includes(c) && !yellows.has(c)) grays.add(c)
      }
    }
  }
  const candidates = WORDS.filter((w) => {
    for (const [i, c] of greens) if (w[i] !== c) return false
    for (const c of grays) if (w.includes(c)) return false
    for (const [c, positions] of yellows) {
      if (!w.includes(c)) return false
      for (const p of positions) if (w[p] === c) return false
    }
    return true
  })
  if (!candidates.length) return "No words match those marks"
  return `Candidates (${candidates.length}):\n${candidates.slice(0, 30).join(", ")}${candidates.length > 30 ? "..." : ""}`
}

// ---- muxB tools:
const DATAMUSE = 'https://api.datamuse.com/words';
const WIKTIONARY = 'https://en.wiktionary.org/w/api.php';

type DatamuseWord = {
  word?: string;
  score?: number;
  tags?: string[];
  defs?: string[];
}

const freqOf = (tags: string[] | undefined): string => {
  const f = (tags ?? []).find((t) => t.startsWith('f:'));
  return f ? f.slice(2) : 'frequency not reported';
}

const defOf = (word: DatamuseWord): string => {
  const d = word.defs?.[0]
  if (!d) return ''
  const clean = d.replace(/^[a-z]+\t/, '').replace(/\s+/g, ' ').trim()
  return clean.length > 140 ? `${clean.slice(0, 140)}...` : clean
}

async function datamuse(query: URLSearchParams, label: string): Promise<DatamuseWord[]> {
  const res = await fetch(`${DATAMUSE}?${query.toString()}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 400) throw new WordleError(`The word service rejected that ${label} query.`)
  if (!res.ok) throw new WordleError(`Word service returned ${res.status}`)
  const data = (await res.json()) as DatamuseWord[]
  if (!Array.isArray(data) || !data.length) throw new WordleError(`The word service has no ${label} for that.`)
  return data
}

// ---- gap4b4 tools:

