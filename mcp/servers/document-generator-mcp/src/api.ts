import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx"
import { writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const UA = "mrfentmen-document-generator-mcp/1.0"
export class DocError extends Error {}

function safeName(filename: string): string {
  const clean = filename.replace(/[^a-zA-Z0-9._-]/g, "_")
  return clean || "document.docx"
}

export async function createDoc(args: { title?: string; body?: string; filename?: string }): Promise<string> {
  const title = (args.title ?? "").trim()
  const body = (args.body ?? "")
  if (!title && !body) throw new DocError("Provide a title or body text")
  const paragraphs: Paragraph[] = []
  if (title) paragraphs.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(title)] }))
  for (const line of body.split(/\n+/).map((l) => l.trim()).filter(Boolean)) {
    paragraphs.push(new Paragraph({ children: [new TextRun(line)], spacing: { after: 120 } }))
  }
  const doc = new Document({ sections: [{ children: paragraphs }] })
  const buffer = await Packer.toBuffer(doc)
  const out = join(tmpdir(), safeName(args.filename ?? "document.docx"))
  writeFileSync(out, buffer)
  return `Word document written to ${out}\nTitle: ${title || "none"} | Paragraphs: ${paragraphs.length - (title ? 1 : 0)}`
}

export async function createReport(args: { title?: string; bullets?: string }): Promise<string> {
  const title = (args.title ?? "").trim()
  if (!title) throw new DocError("Provide a report title")
  const bullets = (args.bullets ?? "").split(",").map((b) => b.trim()).filter(Boolean)
  const children: Paragraph[] = [new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] })]
  for (const b of bullets) {
    children.push(new Paragraph({ text: b, bullet: { level: 0 }, spacing: { after: 80 } }))
  }
  const doc = new Document({ sections: [{ children }] })
  const buffer = await Packer.toBuffer(doc)
  const out = join(tmpdir(), safeName(title.toLowerCase().replace(/\s+/g, "-") + "-report.docx"))
  writeFileSync(out, buffer)
  return `Report written to ${out}\nTitle: ${title} | Bullets: ${bullets.length}`
}

// ---- muxA tools:

import { Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, FileChild } from "docx"
import { readFileSync } from "node:fs"

function clamp(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max))
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQ = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"'
        i += 1
      } else inQ = !inQ
    } else if (ch === "," && !inQ) {
      out.push(cur)
      cur = ""
    } else cur += ch
  }
  out.push(cur)
  return out.map((c) => c.trim())
}

function cell(text: string, header: boolean): TableCell {
  return new TableCell({
    shading: header ? { type: ShadingType.CLEAR, fill: "E8E8E8" } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text: text.slice(0, 300), bold: header })] })],
  })
}

export interface TableDocArgs {
  title?: string;
  csv: string;
  filename?: string;
  has_header?: boolean;
  max_rows?: number;
}

export async function createTableDocument(args: TableDocArgs): Promise<string> {
  const csv = (args.csv ?? "").trim()
  if (!csv) throw new DocError("Provide CSV text with at least a header row and one data row.")
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) throw new DocError("Provide CSV text with at least a header row and one data row.")
  const hasHeader = args.has_header !== false
  const maxRows = clamp(args.max_rows, 200, 2000)
  const bodyLines = lines.slice(1, 1 + maxRows)
  const headerCells = splitCsvLine(lines[0])
  const columns = Math.max(headerCells.length, ...bodyLines.map((l) => splitCsvLine(l).length))
  const rows: TableRow[] = []
  if (hasHeader) {
    rows.push(new TableRow({ tableHeader: true, children: Array.from({ length: columns }, (_, i) => cell(headerCells[i] ?? "", true)) }))
  }
  for (const line of bodyLines) {
    const f = splitCsvLine(line)
    rows.push(new TableRow({ children: Array.from({ length: columns }, (_, i) => cell(f[i] ?? "", false)) }))
  }
  const title = (args.title ?? "").trim()
  const children: FileChild[] = []
  if (title) children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(title)] }))
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: "B0B0B0" },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: "B0B0B0" },
        left: { style: BorderStyle.SINGLE, size: 2, color: "B0B0B0" },
        right: { style: BorderStyle.SINGLE, size: 2, color: "B0B0B0" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D0D0D0" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D0D0D0" },
      },
      rows,
    }),
  )
  const doc = new Document({ sections: [{ children }] })
  const buffer = await Packer.toBuffer(doc)
  const out = join(tmpdir(), safeName(args.filename ?? (title ? title.toLowerCase().replace(/\s+/g, "-") + "-table.docx" : "table.docx")))
  writeFileSync(out, buffer)
  return `Word table written to ${out}\n${columns} columns, ${rows.length} row(s) including header${hasHeader ? "" : " (no header row)"}, ${buffer.length} bytes`
}

function inlineRuns(text: string, opts: { bold?: boolean; italics?: boolean; code?: boolean } = {}): TextRun[] {
  const runs: TextRun[] = []
  const pattern = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3|`([^`]+)`/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index), ...opts }))
    if (m[2] != null) runs.push(new TextRun({ text: m[2], ...opts, bold: true }))
    else if (m[4] != null) runs.push(new TextRun({ text: m[4], ...opts, italics: true }))
    else if (m[6] != null) runs.push(new TextRun({ text: m[6], ...opts, font: "Courier New" }))
    last = pattern.lastIndex
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last), ...opts }))
  return runs.length ? runs : [new TextRun({ text, ...opts })]
}

export interface MarkdownDocArgs {
  markdown: string;
  title?: string;
  filename?: string;
}

export async function createMarkdownDocument(args: MarkdownDocArgs): Promise<string> {
  const md = (args.markdown ?? "").trim()
  if (!md) throw new DocError("Provide markdown text to render.")
  const children: Paragraph[] = []
  const title = (args.title ?? "").trim()
  if (title) children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(title)] }))
  let headings = 0
  let bullets = 0
  let code = 0
  let inCode = false
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trimEnd()
    if (/^```/.test(line.trim())) {
      inCode = !inCode
      continue
    }
    if (inCode) {
      code += 1
      children.push(new Paragraph({ children: [new TextRun({ text: line, font: "Courier New", size: 18 })] }))
      continue
    }
    if (!line.trim()) continue
    const h = /^(#{1,6})\s+(.*)$/.exec(line)
    if (h) {
      headings += 1
      const level = Math.min(h[1].length, 6)
      const heading = [HeadingLevel.TITLE, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5][level - 1]
      children.push(new Paragraph({ heading, children: inlineRuns(h[2]) }))
      continue
    }
    const b = /^(\s*)[-*+]\s+(.*)$/.exec(line)
    if (b) {
      bullets += 1
      children.push(new Paragraph({ bullet: { level: Math.floor(b[1].length / 2) }, children: inlineRuns(b[2]) }))
      continue
    }
    const n = /^(\s*)(\d+)[.)]\s+(.*)$/.exec(line)
    if (n) {
      bullets += 1
      children.push(new Paragraph({ text: `${n[2]}.`, indent: { left: 720 }, children: inlineRuns(n[3]) }))
      continue
    }
    const quote = /^>\s?(.*)$/.exec(line)
    if (quote) {
      children.push(new Paragraph({ indent: { left: 720 }, children: inlineRuns(quote[1], { italics: true }) }))
      continue
    }
    children.push(new Paragraph({ children: inlineRuns(line), spacing: { after: 120 } }))
  }
  if (!children.length) throw new DocError("That markdown produced no renderable content.")
  const doc = new Document({ sections: [{ children }] })
  const buffer = await Packer.toBuffer(doc)
  const out = join(tmpdir(), safeName(args.filename ?? (title ? title.toLowerCase().replace(/\s+/g, "-") + ".docx" : "markdown.docx")))
  writeFileSync(out, buffer)
  return `Word document written to ${out}\n${headings} heading(s), ${bullets} list item(s), ${code} code line(s), ${buffer.length} bytes`
}

export interface ExtractArgs {
  path: string;
  max_chars?: number;
}

export async function extractDocxText(args: ExtractArgs): Promise<string> {
  const p = (args.path ?? "").trim()
  if (!p) throw new DocError("Provide the path to a .docx file.")
  const JSZip = (await import("jszip")) as unknown as { default?: new () => any; new (): any }
  const Ctor = (JSZip as any).default ?? JSZip
  const zip = new Ctor()
  let raw: Buffer
  try {
    raw = readFileSync(p)
  } catch {
    throw new DocError(`Cannot read ${p}.`)
  }
  const doc = await zip.loadAsync(raw)
  const file = doc.file("word/document.xml")
  if (!file) throw new DocError(`${p} does not look like a Word document (no word/document.xml).`)
  const xml = await file.async("string")
  const text = xml
    .replace(/<w:p[ >]/g, "\n<w:p ")
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  const max = clamp(args.max_chars, 4000, 200000)
  return `Text extracted from ${p}: ${text.length} characters, showing ${Math.min(max, text.length)}.\n${text.slice(0, max)}${text.length > max ? "\n... truncated" : ""}`
}
