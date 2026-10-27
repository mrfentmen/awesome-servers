/**
 * Text Diff — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "Text Diff"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "text-diff-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

const MAX_LINES = 1500
const MAX_CHARS = 300000

interface Op {
  type: "keep" | "add" | "del"
  line: string
}

function toLines(text: string, label: string): string[] {
  if (text.length > MAX_CHARS) throw new SourceError(`${label} is ${text.length} characters; the limit is ${MAX_CHARS}`)
  const normalized = text.replace(/\r\n/g, "\n")
  const lines = normalized.split("\n")
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop()
  if (lines.length > MAX_LINES) throw new SourceError(`${label} has ${lines.length} lines; the limit is ${MAX_LINES}`)
  return lines
}

function lcsOps(a: string[], b: string[]): Op[] {
  const n = a.length
  const m = b.length
  const width = m + 1
  const dp = new Uint32Array((n + 1) * width)
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * width + j] = a[i] === b[j]
        ? dp[(i + 1) * width + j + 1] + 1
        : Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1])
    }
  }
  const ops: Op[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "keep", line: a[i] })
      i++
      j++
    } else if (dp[(i + 1) * width + j] >= dp[i * width + j + 1]) {
      ops.push({ type: "del", line: a[i] })
      i++
    } else {
      ops.push({ type: "add", line: b[j] })
      j++
    }
  }
  while (i < n) {
    ops.push({ type: "del", line: a[i] })
    i++
  }
  while (j < m) {
    ops.push({ type: "add", line: b[j] })
    j++
  }
  return ops
}

function hunks(ops: Op[], context: number): Array<{ ops: Op[]; aStart: number; aCount: number; bStart: number; bCount: number }> {
  const changed: number[] = []
  ops.forEach((op, idx) => {
    if (op.type !== "keep") changed.push(idx)
  })
  if (!changed.length) return []
  const ranges: Array<[number, number]> = []
  for (const idx of changed) {
    const start = Math.max(0, idx - context)
    const end = Math.min(ops.length - 1, idx + context)
    const last = ranges[ranges.length - 1]
    if (last && start <= last[1] + 1) last[1] = Math.max(last[1], end)
    else ranges.push([start, end])
  }
  const aBefore = new Array(ops.length + 1).fill(0)
  const bBefore = new Array(ops.length + 1).fill(0)
  ops.forEach((op, idx) => {
    aBefore[idx + 1] = aBefore[idx] + (op.type === "add" ? 0 : 1)
    bBefore[idx + 1] = bBefore[idx] + (op.type === "del" ? 0 : 1)
  })
  return ranges.map(([start, end]) => {
    const slice = ops.slice(start, end + 1)
    const aCount = slice.filter((o) => o.type !== "add").length
    const bCount = slice.filter((o) => o.type !== "del").length
    return {
      ops: slice,
      aStart: aCount === 0 ? aBefore[start] : aBefore[start] + 1,
      aCount,
      bStart: bCount === 0 ? bBefore[start] : bBefore[start] + 1,
      bCount,
    }
  })
}

export async function unifiedDiff(a: { before: string; after: string; context?: number; labelBefore?: string; labelAfter?: string }): Promise<string> {
  const before = toLines(a.before, "before")
  const after = toLines(a.after, "after")
  const context = a.context ?? 3
  if (!Number.isInteger(context) || context < 0 || context > 10) throw new SourceError("context must be between 0 and 10")
  const ops = lcsOps(before, after)
  const groups = hunks(ops, context)
  if (!groups.length) return `No differences: both texts have the same ${before.length} line(s).`
  const added = ops.filter((o) => o.type === "add").length
  const removed = ops.filter((o) => o.type === "del").length
  const header = [
    `--- ${clean(a.labelBefore) || "before"}`,
    `+++ ${clean(a.labelAfter) || "after"}`,
  ]
  const body = groups.map((h) => {
    const meta = `@@ -${h.aStart},${h.aCount} +${h.bStart},${h.bCount} @@`
    const lines = h.ops.map((op) => `${op.type === "keep" ? " " : op.type === "add" ? "+" : "-"}${op.line}`)
    return [meta, ...lines].join("\n")
  })
  return [
    `Unified diff (${groups.length} hunk(s), ${added} line(s) added, ${removed} removed):`,
    "",
    ...header,
    ...body,
  ].join("\n")
}

export async function diffStats(a: { before: string; after: string }): Promise<string> {
  const before = toLines(a.before, "before")
  const after = toLines(a.after, "after")
  const ops = lcsOps(before, after)
  const added = ops.filter((o) => o.type === "add").length
  const removed = ops.filter((o) => o.type === "del").length
  const kept = ops.filter((o) => o.type === "keep").length
  return [
    before.join("\n") === after.join("\n") ? "The texts are identical." : "The texts differ.",
    "",
    `before: ${before.length} line(s) · after: ${after.length} line(s)`,
    `unchanged: ${kept} · added: ${added} · removed: ${removed}`,
    `net line change: ${added - removed >= 0 ? "+" : ""}${added - removed}`,
    added + removed === 0 ? "No line-level changes." : `Changed lines: ${added + removed}`,
  ].join("\n")
}
