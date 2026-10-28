const ROOT = "https://www.unicode.org/Public/UCD/latest/ucd"
const EMOJI = "https://www.unicode.org/Public/emoji/latest"
const HEADERS = { "User-Agent": "mrfentmen-unicode-mcp/1.0" }

export class UnicodeError extends Error {}
let unicodeLines: string[] | null = null
let blockLines: string[] | null = null
let emojiLines: string[] | null = null

async function lines(url: string, cache: "unicode" | "blocks" | "emoji"): Promise<string[]> {
  const current = cache === "unicode" ? unicodeLines : cache === "blocks" ? blockLines : emojiLines
  if (current) return current
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new UnicodeError(`Unicode data error ${response.status}`)
  const value = (await response.text()).split(/\r?\n/)
  if (cache === "unicode") unicodeLines = value
  else if (cache === "blocks") blockLines = value
  else emojiLines = value
  return value
}

function hex(value: string): number {
  const parsed = Number.parseInt(value.replace(/^U\+/, ""), 16)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 0x10ffff) throw new UnicodeError(`Invalid Unicode code point: ${value}`)
  return parsed
}

export async function character(value: string) {
  const codePoint = hex(value)
  const key = codePoint.toString(16).toUpperCase().padStart(4, "0")
  const rows = await lines(`${ROOT}/UnicodeData.txt`, "unicode")
  const exact = rows.find((line) => line.startsWith(`${key};`))
  const fields = exact?.split(";")
  if (fields) return { codePoint: `U+${key}`, name: fields[1], category: fields[2], combiningClass: fields[3], bidiClass: fields[4], decomposition: fields[5] || null, decimal: fields[6] || null, digit: fields[7] || null, numeric: fields[8] || null, mirrored: fields[9] }
  const number = codePoint
  for (let index = 0; index < rows.length; index += 1) {
    const first = rows[index]
    if (!first.includes("First>")) continue
    const firstFields = first.split(";")
    const start = hex(firstFields[0])
    if (start > number) continue
    const last = rows.slice(index + 1).find((line) => line.includes("Last>"))
    if (!last) continue
    const end = hex(last.split(";")[0])
    if (number <= end) {
      return { codePoint: `U+${key}`, name: `${firstFields[1].replace(/, First>/, "")}, range record`, category: firstFields[2], combiningClass: firstFields[3], bidiClass: firstFields[4], range: true }
    }
  }
  return null
}

export async function searchBlocks(query: string) {
  const q = query.toLowerCase()
  return (await lines(`${ROOT}/Blocks.txt`, "blocks")).filter((line) => !line.startsWith("#") && line.toLowerCase().includes(q)).slice(0, 30).map((line) => line.split("#")[0].trim())
}

export async function emojiSearch(query: string) {
  const q = query.toLowerCase()
  return (await lines(`${EMOJI}/emoji-test.txt`, "emoji")).filter((line) => !line.startsWith("#") && line.toLowerCase().includes(q)).slice(0, 30).map((line) => line.trim())
}

export function format(value: unknown): string { return JSON.stringify(value, null, 2).slice(0, 14000) }
