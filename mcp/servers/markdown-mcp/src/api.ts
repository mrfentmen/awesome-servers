import { marked } from "marked"

export class MdError extends Error {}

export async function toHtml(args: { markdown?: string }): Promise<string> {
  const md = args.markdown ?? ""
  if (!md.trim()) throw new MdError("Provide markdown text")
  const html = await marked.parse(md)
  return html.slice(0, 8000)
}

export async function headings(args: { markdown?: string }): Promise<string> {
  const md = args.markdown ?? ""
  const lines = md.split("\n")
  const out: string[] = []
  for (const line of lines) {
    const m = /^(#{1,6})\s+(.*)$/.exec(line)
    if (m) out.push(`${"  ".repeat(m[1].length - 1)}${m[1].length}. ${m[2]}`)
  }
  return out.join("\n") || "No headings found"
}

// ---- muxC tools:

/** Build a pipe table from rows, which is the one markdown shape you always have to hand write. */
export async function tableToMarkdown(args: { headers?: string[]; rows?: string[][]; align?: string[] }): Promise<string> {
  const headers = (args.headers ?? []).map((h) => String(h).trim())
  const rows = (args.rows ?? []).map((r) => r.map((c) => String(c ?? "").trim()))
  if (headers.length < 1) throw new Error("Provide at least one column header")
  if (rows.some((r) => r.length !== headers.length)) throw new Error(`Every row must have exactly ${headers.length} cells, one per header`)
  const align = (args.align ?? []).map((a) => String(a).trim().toLowerCase())
  const cell = (s: string) => s.replace(/\|/g, "\\|")
  const sep = headers.map((_, i) => {
    const a = align[i]
    if (a === "left") return ":---"
    if (a === "right") return "---:"
    if (a === "center") return ":---:"
    return "---"
  })
  return [`| ${headers.map(cell).join(" | ")} |`, `| ${sep.join(" | ")} |`, ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`)].join("\n")
}

/** Lint a markdown document: heading structure, unclosed fences and table rows. */
export async function checkDocument(args: { markdown?: string }): Promise<string> {
  const md = args.markdown ?? ""
  if (!md.trim()) return "Provide a markdown document to check."
  const lines = md.split(/\r?\n/)
  const headings: Array<{ n: number; text: string; line: number }> = []
  let inFence = false
  let fences = 0
  let tables = 0
  lines.forEach((l, i) => {
    if (/^\s*(```|~~~)/.test(l)) {
      fences++
      inFence = !inFence
      return
    }
    if (inFence) return
    const h = l.match(/^(#{1,6})\s+(.*)$/)
    if (h) headings.push({ n: h[1].length, text: h[2].trim(), line: i + 1 })
    if (/^\s*\|.*\|\s*$/.test(l)) tables++
  })
  const problems: string[] = []
  if (inFence) problems.push("a code fence is opened but never closed")
  if (fences % 2 === 1) problems.push(`there are ${fences} fence markers, which is an odd number`)
  for (let i = 1; i < headings.length; i++) {
    const jump = headings[i].n - headings[i - 1].n
    if (jump > 1) problems.push(`line ${headings[i].line}: heading level jumps from h${headings[i - 1].n} to h${headings[i].n} ("${headings[i].text.slice(0, 40)}")`)
  }
  if (headings.length && headings[0].n !== 1) problems.push(`the document starts at h${headings[0].n}, not h1`)
  if (!headings.length) problems.push("the document has no headings at all")
  return [
    `Checked ${lines.length} line(s): ${headings.length} heading(s), ${fences} fence marker(s), ${tables} table row(s).`,
    problems.length ? `problems (${problems.length}):\n${problems.map((p) => `  - ${p}`).join("\n")}` : "no structural problems found",
  ].join("\n")
}
