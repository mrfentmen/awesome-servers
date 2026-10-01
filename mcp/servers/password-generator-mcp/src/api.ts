import { randomInt } from "node:crypto"

export class PassError extends Error {}

const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
const NUMBERS = "0123456789"
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?"

const WORDS = [
  "cloud", "river", "ember", "falcon", "maple", "orbit", "stone", "breeze",
  "canyon", "dolphin", "eclipse", "forest", "glacier", "horizon", "island",
  "juniper", "kelp", "lantern", "meadow", "nebula", "ocean", "peak", "quartz",
  "ridge", "summit", "tide", "uplift", "valley", "willow", "zenith",
  "aster", "boulder", "cedar", "delta", "evergreen", "foxtail", "granite",
  "harbor", "iris", "jade", "karst", "lagoon", "marble", "north", "opal",
]

export async function generatePassword(args: { length?: number; symbols?: boolean; numbers?: boolean }): Promise<string> {
  const length = Math.min(Math.max(args.length ?? 16, 8), 64)
  const useSymbols = args.symbols !== false
  const useNumbers = args.numbers !== false
  let pool = LETTERS
  if (useNumbers) pool += NUMBERS
  if (useSymbols) pool += SYMBOLS
  const bytes = new Uint8Array(length)
  let out = ""
  for (let i = 0; i < length; i++) {
    out += pool[randomInt(pool.length)]
  }
  void bytes
  return out
}

export async function passphrase(args: { words?: number }): Promise<string> {
  const n = Math.min(Math.max(args.words ?? 4, 2), 12)
  const picks: string[] = []
  for (let i = 0; i < n; i++) picks.push(WORDS[randomInt(WORDS.length)])
  return picks.join("-") + `-${randomInt(10)}${randomInt(10)}`
}

// ---- muxB tools:

const KEYBOARD_ROWS = [
  "1234567890",
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
  "1qaz2wsx3edc4rfv5tgb6yhn7ujm8ik9ol0p",
  "poiuytrewq9lkjhgfdsamnbvcxz",
]

const PRINTABLE = (code: number) => code >= 48 && code <= 122

/** Longest runs of steps of +1 or -1, reported once each rather than per window. */
function maximalRuns(
  codes: number[],
  usable: (code: number) => boolean,
  minimum: number
): Array<{ start: number; end: number; step: number }> {
  const runs: Array<{ start: number; end: number; step: number }> = []
  let i = 0
  while (i < codes.length) {
    let step = 0
    if (i + 1 < codes.length && usable(codes[i]) && usable(codes[i + 1])) {
      const delta = codes[i + 1] - codes[i]
      if (delta === 1 || delta === -1) step = delta
    }
    if (!step) {
      i++
      continue
    }
    let j = i + 1
    while (j + 1 < codes.length && usable(codes[j + 1]) && codes[j + 1] - codes[j] === step) j++
    if (j - i + 1 >= minimum) runs.push({ start: i, end: j, step })
    i = j + 1
  }
  return runs
}

/** Doubled or tripled characters, like aaa or 111, and short blocks repeated. */
function repeats(password: string): string[] {
  const out: string[] = []
  for (const run of [...new Set(password.match(/(.)\1{2,}/g) ?? [])]) {
    out.push(`"${run}" x${run.length} in a row`)
  }
  const body = password.replace(/[^a-z0-9]/gi, "")
  const chunks: string[] = []
  for (const size of [2, 3, 4]) {
    for (let i = 0; i + size * 2 <= body.length; i += size) {
      if (body.slice(i, i + size) === body.slice(i + size, i + size * 2)) chunks.push(body.slice(i, i + size))
    }
  }
  for (const chunk of [...new Set(chunks)]) out.push(`"${chunk}" repeated back to back`)
  return out
}

/** Ascending or descending runs of three or more characters, counted as maximal runs. */
function sequences(password: string): string[] {
  const codes = [...password].map((char) => char.toLowerCase().charCodeAt(0))
  const runs = maximalRuns(codes, PRINTABLE, 3).map(
    (run) => `${run.end - run.start + 1} characters ${run.step === 1 ? "ascending" : "descending"}: ${password.slice(run.start, run.end + 1)}`
  )
  return [...new Set(runs)]
}

/** Maximal runs of four or more steps along a QWERTY row, column or diagonal. */
function keyboardWalks(password: string): string[] {
  const lower = password.toLowerCase()
  const rows = [...KEYBOARD_ROWS, ...KEYBOARD_ROWS.map((row) => [...row].reverse().join(""))]
  const found: string[] = []
  for (const row of rows) {
    const position = new Map([...row].map((char, index) => [char, index]))
    const codes = [...lower].map((char) => position.get(char) ?? -1)
    for (const run of maximalRuns(codes, (code) => code >= 0, 4)) {
      const slice = password.slice(run.start, run.end + 1)
      if (!found.includes(slice)) found.push(slice)
    }
  }
  return found
}

export async function passwordPatterns(args: { password?: string }): Promise<string> {
  const password = args.password ?? ""
  if (!password) throw new PassError("Provide a password to inspect")
  if (password.length > 4096) throw new PassError("Keep the password under 4096 characters")

  const found: string[] = [
    ...repeats(password).map((note) => `repeats: ${note}`),
    ...sequences(password).map((run) => `sequence: ${run}`),
    ...keyboardWalks(password).map((run) => `keyboard walk: "${run}" follows a straight line across a QWERTY row, column or diagonal`),
  ]
  const years = password.match(/(?<![0-9])(19|20)\d{2}(?![0-9])/g) ?? []
  if (years.length) found.push(`date-like: the year ${[...new Set(years)].join(", ")}`)
  const words = password.toLowerCase().match(/[a-z]{4,}/g) ?? []
  if (words.length) {
    const vowels = (text: string) => (text.match(/[aeiou]/g) ?? []).length
    const wordy = words.filter((word) => vowels(word) >= 1)
    if (wordy.length) {
      found.push(`word-like: ${wordy.length} lowercase run${wordy.length === 1 ? "" : "s"} of 4+ letters with vowels (${wordy.length} of ${words.length} runs)`)
    }
  }
  const uniq = new Set(password.split("")).size
  if (uniq <= 3 && password.length > 4) {
    found.push(`variety: only ${uniq} distinct characters across ${password.length}`)
  }

  if (!found.length) {
    return [
      `no patterns found in ${password.length} characters`,
      "no repeated runs, no 3+ character sequences, no 4+ step keyboard walks, no year, and no long lowercase word runs",
    ].join("\n")
  }
  const CAP = 12
  return [
    `${found.length} pattern${found.length === 1 ? "" : "s"} found in ${password.length} characters (${uniq} distinct)`,
    ...found.slice(0, CAP).map((note) => `   ${note}`),
    ...(found.length > CAP ? [`   ... ${found.length - CAP} more`] : []),
  ].join("\n")
}
