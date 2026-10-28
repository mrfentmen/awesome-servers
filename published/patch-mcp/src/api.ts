/**
 * Unified Patch — keyless public API client.
 */

export class SourceError extends Error {}

const MAX_LINES = 3000

type Hunk = { oldStart: number; oldCount: number; newStart: number; newCount: number; body: string[] }
type FilePatch = { oldPath: string; newPath: string; hunks: Hunk[] }

function linesOf(text: string): string[] {
  if (text === "") return []
  const lines = text.replace(/\r\n?/g, "\n").split("\n")
  // A trailing newline marks the end of the last line; it is not an extra
  // empty line for diff-count purposes.
  if (lines[lines.length - 1] === "") lines.pop()
  return lines
}

function endsWithNewline(text: string): boolean {
  return /\n$/.test(text)
}

function parseHunkHeader(line: string): { oldStart: number; oldCount: number; newStart: number; newCount: number } {
  const m = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/)
  if (!m) throw new SourceError(`not a valid hunk header: "${line.slice(0, 60)}"`)
  return {
    oldStart: Number(m[1]),
    oldCount: m[2] === undefined ? 1 : Number(m[2]),
    newStart: Number(m[3]),
    newCount: m[4] === undefined ? 1 : Number(m[4]),
  }
}

function parsePatch(patch: string): FilePatch[] {
  const lines = linesOf(patch)
  const files: FilePatch[] = []
  let current: FilePatch | null = null
  let hunk: Hunk | null = null
  let ignoredMarker = false
  const finishHunk = () => {
    if (hunk && current) current.hunks.push(hunk)
    hunk = null
  }
  for (const line of lines) {
    if (line.startsWith("--- ")) {
      finishHunk()
      current = { oldPath: line.slice(4).trim() || "a", newPath: "", hunks: [] }
      files.push(current)
      continue
    }
    if (line.startsWith("+++ ")) {
      if (!current) throw new SourceError("patch has a +++ line before any --- line")
      current.newPath = line.slice(4).trim() || "b"
      continue
    }
    if (line.startsWith("@@")) {
      if (!current) throw new SourceError("patch has a hunk before any file header")
      finishHunk()
      const header = parseHunkHeader(line)
      const tail = line.replace(/^@@ -[^@]*@@/, "")
      hunk = { ...header, body: [] }
      if (tail.trim()) throw new SourceError("hunk header has unexpected text after the ranges")
      continue
    }
    if (line.startsWith("\\")) {
      ignoredMarker = true
      continue
    }
    if (hunk) {
      const prefix = line.charAt(0)
      if (prefix !== " " && prefix !== "-" && prefix !== "+") {
        throw new SourceError(`hunk line must start with a space, - or +: "${line.slice(0, 60)}"`)
      }
      hunk.body.push(line)
      continue
    }
    if (line.trim() !== "") throw new SourceError("patch has text outside any hunk")
  }
  finishHunk()
  if (!files.length) throw new SourceError("no file header (--- / +++) found in the patch")
  for (const file of files) {
    if (!file.hunks.length) throw new SourceError(`file "${file.oldPath}" has no hunks`)
  }
  for (const file of files) {
    for (const h of file.hunks) {
      const oldCount = h.body.filter((l) => l[0] === " " || l[0] === "-").length
      const newCount = h.body.filter((l) => l[0] === " " || l[0] === "+").length
      if (oldCount !== h.oldCount || newCount !== h.newCount) {
        throw new SourceError(
          `hunk at old line ${h.oldStart} declares -${h.oldCount}/+${h.newCount} but contains -${oldCount}/+${newCount}`
        )
      }
    }
  }
  return { files, ignoredMarker } as any
}

function reverseHunks(hunks: Hunk[]): Hunk[] {
  return hunks.map((h) => ({
    oldStart: h.newStart,
    oldCount: h.newCount,
    newStart: h.oldStart,
    newCount: h.oldCount,
    body: h.body.map((l) => (l[0] === "+" ? "-" + l.slice(1) : l[0] === "-" ? "+" + l.slice(1) : l)),
  }))
}

function applyFile(text: string, patch: FilePatch): { text: string; added: number; removed: number } {
  const old = linesOf(text)
  const out: string[] = []
  let cursor = 0
  let added = 0
  let removed = 0
  for (const hunk of patch.hunks) {
    const target = hunk.oldStart - 1
    if (target < cursor) throw new SourceError(`hunks overlap or run backwards at old line ${hunk.oldStart}`)
    while (cursor < target) out.push(old[cursor++])
    for (const body of hunk.body) {
      const prefix = body[0]
      const content = body.slice(1)
      if (prefix === "+") {
        out.push(content)
        added++
        continue
      }
      const actual = old[cursor]
      if (actual === undefined) {
        throw new SourceError(`hunk expects line ${cursor + 1} but the text ends early`)
      }
      if (actual !== content) {
        throw new SourceError(
          `hunk does not match at line ${cursor + 1}: expected "${content.slice(0, 60)}" but found "${actual.slice(0, 60)}"`
        )
      }
      if (prefix === " ") out.push(actual)
      else removed++
      cursor++
    }
  }
  while (cursor < old.length) out.push(old[cursor++])
  return { text: out.join("\n") + (endsWithNewline(text) && out.length ? "\n" : ""), added, removed }
}

function diffPairs(a: string[], b: string[]): string[] {
  const n = a.length
  const m = b.length
  if (n > MAX_LINES || m > MAX_LINES) {
    throw new SourceError(`inputs are limited to ${MAX_LINES} lines each (got ${n} and ${m})`)
  }
  const width = m + 1
  const dp = new Uint32Array((n + 1) * width)
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * width + j] =
        a[i] === b[j]
          ? dp[(i + 1) * width + j + 1] + 1
          : Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1])
    }
  }
  const out: string[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push(" " + a[i++])
      j++
    } else if (dp[(i + 1) * width + j] >= dp[i * width + j + 1]) {
      out.push("-" + a[i++])
    } else {
      out.push("+" + b[j++])
    }
  }
  while (i < n) out.push("-" + a[i++])
  while (j < m) out.push("+" + b[j++])
  return out
}

export async function makePatch(a: { before: string; after: string; context?: number; oldPath?: string; newPath?: string }): Promise<string> {
  const context = Math.floor(a.context ?? 3)
  if (!Number.isInteger(context) || context < 0 || context > 20) throw new SourceError("context must be between 0 and 20")
  const before = linesOf(a.before)
  const after = linesOf(a.after)
  const pairs = diffPairs(before, after)
  const changed = pairs.map((line, idx) => (line[0] === " " ? -1 : idx)).filter((idx) => idx >= 0)
  if (!changed.length) return "No differences between before and after."
  const ranges: Array<{ start: number; end: number }> = []
  for (const idx of changed) {
    const start = Math.max(0, idx - context)
    const end = Math.min(pairs.length - 1, idx + context)
    const last = ranges[ranges.length - 1]
    if (last && start <= last.end + 1) last.end = Math.max(last.end, end)
    else ranges.push({ start, end })
  }
  const oldPath = a.oldPath ?? "a"
  const newPath = a.newPath ?? "b"
  const header = [`--- ${oldPath}`, `+++ ${newPath}`]
  for (const range of ranges) {
    const body = pairs.slice(range.start, range.end + 1)
    let oldStart = 1
    let newStart = 1
    for (let k = 0; k < range.start; k++) {
      if (pairs[k][0] !== "+") oldStart++
      if (pairs[k][0] !== "-") newStart++
    }
    const oldCount = body.filter((l) => l[0] !== "+").length
    const newCount = body.filter((l) => l[0] !== "-").length
    header.push(`@@ -${oldCount ? oldStart : oldStart - 1},${oldCount} +${newCount ? newStart : newStart - 1},${newCount} @@`)
    header.push(...body)
  }
  return [
    `Unified diff — ${changed.length} changed line(s), ${ranges.length} hunk(s):`,
    "",
    ...header,
  ].join("\n")
}

export async function applyPatch(a: { text: string; patch: string; reverse?: boolean }): Promise<string> {
  const parsed: any = parsePatch(a.patch)
  if (parsed.ignoredMarker) {
    // "\ No newline at end of file" markers are dropped during parsing.
  }
  const files: FilePatch[] = parsed.files
  const target = files[0]
  if (a.reverse) target.hunks = reverseHunks(target.hunks)
  const result = applyFile(a.text, target)
  const beforeLines = linesOf(a.text).length
  const afterLines = linesOf(result.text).length
  return [
    `Patch applied${a.reverse ? " in reverse" : ""}: +${result.added} line(s), -${result.removed} line(s).`,
    `Lines: ${beforeLines} -> ${afterLines}`,
    a.reverse ? `(reverse of ${files[0].hunks.length} hunk(s))` : `(${target.hunks.length} hunk(s))`,
    "",
    result.text,
  ].join("\n")
}

export async function checkPatch(a: { text: string; patch: string }): Promise<string> {
  const parsed: any = parsePatch(a.patch)
  const target: FilePatch = parsed.files[0]
  const added = target.hunks.reduce((sum, h) => sum + h.body.filter((l) => l[0] === "+").length, 0)
  const removed = target.hunks.reduce((sum, h) => sum + h.body.filter((l) => l[0] === "-").length, 0)
  try {
    applyFile(a.text, target)
  } catch (e) {
    return `Patch does NOT apply: ${(e as Error).message}`
  }
  return [
    `Patch applies cleanly.`,
    `File: ${target.oldPath} -> ${target.newPath}`,
    `Hunks: ${target.hunks.length}, +${added} line(s), -${removed} line(s)`,
  ].join("\n")
}
