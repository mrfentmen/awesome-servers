const UA = "mrfentmen-text-tools-mcp/1.0"
export class TextError extends Error {}

export async function slugify(args: { text?: string }): Promise<string> {
  const text = (args.text ?? "").trim()
  if (!text) throw new TextError("Provide text to slugify")
  const slug = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
  return slug || "empty-slug"
}

export async function toCase(args: { text?: string; style?: string }): Promise<string> {
  const text = (args.text ?? "").trim()
  if (!text) throw new TextError("Provide input text")
  const style = (args.style ?? "camel").toLowerCase()
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? []
  if (!words.length) throw new TextError("No words found")
  const cap = (w: string) => w[0].toUpperCase() + w.slice(1)
  switch (style) {
    case "camel":
      return words[0] + words.slice(1).map(cap).join("")
    case "snake":
      return words.join("_")
    case "kebab":
      return words.join("-")
    case "title":
      return words.map(cap).join(" ")
    default:
      throw new TextError("Style must be camel, snake, kebab, or title")
  }
}

export async function base64(args: { text?: string; decode?: boolean }): Promise<string> {
  const text = (args.text ?? "")
  if (!text) throw new TextError("Provide input text")
  try {
    if (args.decode) {
      const out = Buffer.from(text, "base64").toString("utf-8")
      if (!out && text.trim()) throw new Error("invalid")
      return `Decoded: ${out}`
    }
    return `Encoded: ${Buffer.from(text, "utf-8").toString("base64")}`
  } catch {
    throw new TextError("Invalid base64 input")
  }
}

// ---- muxB tools:
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })

/** Vowel-group syllable estimate, the standard cheap heuristic. */
function countSyllables(word: string): number {
  const letters = word.toLowerCase().replace(/[^a-z]/g, "")
  if (!letters) return 0
  if (letters.length <= 3) return 1
  const trimmed = letters
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
  const groups = trimmed.match(/[aeiouy]{1,2}/g)
  return Math.max(1, groups ? groups.length : 1)
}

const round1 = (value: number) => Math.round(value * 10) / 10

export async function textMetrics(args: { text?: string }): Promise<string> {
  const raw = args.text ?? ""
  if (!raw.trim()) throw new TextError("Provide some text to measure")
  if (raw.length > 200000) throw new TextError("Keep the text under 200,000 characters")

  const graphemes = [...segmenter.segment(raw)].length
  const words = raw.match(/[\p{L}\p{N}'-]+/gu) ?? []
  const sentences = raw.split(/[.!?]+(?:\s|$)/).filter((part) => part.trim().length > 0)
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0)
  const nonAscii = [...raw].filter((char) => char.codePointAt(0)! > 127).length
  const letters = (raw.match(/\p{L}/gu) ?? []).length
  const wordLengths = words.map((word) => word.length)
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "")
  const unique = new Set(words.map((word) => word.toLowerCase())).size

  // Flesch reading ease and Flesch-Kincaid grade, from the same counts.
  const wordCount = words.length
  const sentenceCount = Math.max(sentences.length, 1)
  const readingEase = wordCount
    ? round1(206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount))
    : 0
  const grade = wordCount
    ? round1(0.39 * (wordCount / sentenceCount) + 11.8 * (syllables / wordCount) - 15.59)
    : 0
  const ease =
    readingEase >= 90 ? "very easy (5th grade)"
    : readingEase >= 80 ? "easy (6th grade)"
    : readingEase >= 70 ? "fairly easy (7th grade)"
    : readingEase >= 60 ? "plain English (8th-9th grade)"
    : readingEase >= 50 ? "fairly difficult (10th-12th grade)"
    : readingEase >= 30 ? "difficult (college)"
    : "very difficult (graduate)"

  return [
    `characters: ${raw.length} | without whitespace: ${raw.replace(/\s/g, "").length} | graphemes: ${graphemes} | non-ASCII characters: ${nonAscii}`,
    `letters: ${letters} | digits: ${(raw.match(/[0-9]/g) ?? []).length}`,
    `words: ${wordCount} (${unique} unique) | sentences: ${sentences.length} | lines: ${raw.split("\n").length} | paragraphs: ${raw.split(/\n\s*\n/).filter((part) => part.trim()).length}`,
    `average word length: ${wordCount ? round1(wordLengths.reduce((a, b) => a + b, 0) / wordCount) : 0} characters | longest word: ${longest ? `${longest} (${longest.length})` : "not reported"}`,
    `estimated syllables: ${syllables} | average ${wordCount ? round1(syllables / wordCount) : 0} per word`,
    `Flesch reading ease: ${readingEase} - ${ease}`,
    `Flesch-Kincaid grade level: ${grade}`,
    `reading time at 200 words a minute: ${wordCount ? round1(wordCount / 200) : 0} minutes`,
  ].join("\n")
}

type DiffOp = { tag: "=" | "-" | "+"; line: string }

/** Longest-common-subsequence line diff, computed here so no dependency is needed. */
function diffLines(before: string[], after: string[]): DiffOp[] {
  const n = before.length
  const m = after.length
  // Trim the common prefix and suffix first, so the table stays small.
  let start = 0
  while (start < n && start < m && before[start] === after[start]) start++
  let endB = n - 1
  let endA = m - 1
  while (endB >= start && endA >= start && before[endB] === after[endA]) {
    endB--
    endA--
  }
  const left = before.slice(start, endB + 1)
  const right = after.slice(start, endA + 1)
  const table: number[][] = Array.from({ length: left.length + 1 }, () => new Array<number>(right.length + 1).fill(0))
  for (let i = left.length - 1; i >= 0; i--) {
    for (let j = right.length - 1; j >= 0; j--) {
      table[i][j] = left[i] === right[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }
  const out: DiffOp[] = before.slice(0, start).map((line) => ({ tag: "=" as const, line }))
  let i = 0
  let j = 0
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      out.push({ tag: "=", line: left[i] })
      i++
      j++
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      out.push({ tag: "-", line: left[i] })
      i++
    } else {
      out.push({ tag: "+", line: right[j] })
      j++
    }
  }
  while (i < left.length) out.push({ tag: "-", line: left[i++] })
  while (j < right.length) out.push({ tag: "+", line: right[j++] })
  for (const line of after.slice(endA + 1)) out.push({ tag: "=", line })
  return out
}

export async function diffText(args: { before?: string; after?: string; context?: number }): Promise<string> {
  const before = args.before ?? ""
  const after = args.after ?? ""
  if (!before && !after) throw new TextError("Provide the before and/or after text")
  if (before.length + after.length > 200000) throw new TextError("Keep the two texts under 200,000 characters together")
  const context = Math.min(Math.max(Math.trunc(Number(args.context ?? 1)), 0), 10)

  const ops = diffLines(before.split("\n"), after.split("\n"))
  const removed = ops.filter((op) => op.tag === "-").length
  const added = ops.filter((op) => op.tag === "+").length
  const changed = ops.filter((op) => op.tag === "=").length
  if (!removed && !added) {
    return `The two texts are identical line for line (${ops.length} line${ops.length === 1 ? "" : "s"}).`
  }

  // Keep every change plus `context` unchanged lines either side of it.
  const keep = new Set<number>()
  ops.forEach((op, index) => {
    if (op.tag === "=") return
    for (let i = Math.max(0, index - context); i <= Math.min(ops.length - 1, index + context); i++) keep.add(i)
  })
  const lines: string[] = []
  let skipping = false
  ops.forEach((op, index) => {
    if (!keep.has(index)) {
      skipping = true
      return
    }
    if (skipping) {
      lines.push("   ...")
      skipping = false
    }
    const marker = op.tag === "=" ? "  " : op.tag === "-" ? "- " : "+ "
    lines.push(`${marker}${op.line.length > 200 ? `${op.line.slice(0, 200)}...` : op.line}`)
  })

  // Cap the printed diff so a large input cannot flood the caller.
  const CAP = 120
  const shown = lines.slice(0, CAP)
  return [
    `line diff: ${removed} removed, ${added} added, ${changed} unchanged (${ops.length} lines compared)`,
    `   legend: "- " only in before, "+ " only in after, "  " same on both sides`,
    ...shown,
    ...(lines.length > CAP ? [`   ... ${lines.length - CAP} more diff lines not shown`] : []),
  ].join("\n")
}
