import { promises as fs } from "node:fs"
import path from "node:path"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { errorMessage, fail, text, ToolError } from "./run.js"

const MAX_INPUT = 4_000_000
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", ".mcp-build"])

async function readInput(input: { path?: string; content?: string; cwd?: string }): Promise<{ body: string; file?: string }> {
  if (input.path && input.content !== undefined) throw new ToolError("Use path or content, not both")
  if (input.content !== undefined) {
    if (input.content.length > MAX_INPUT) throw new ToolError(`Input is larger than ${MAX_INPUT} characters`)
    return { body: input.content }
  }
  if (!input.path) throw new ToolError("Provide a path or content")
  if (input.path.includes("\0")) throw new ToolError("Path contains a null byte")
  const file = path.isAbsolute(input.path) ? input.path : path.resolve(input.cwd ? path.resolve(input.cwd) : process.cwd(), input.path)
  const stat = await fs.stat(file)
  if (!stat.isFile()) throw new ToolError(`Not a file: ${file}`)
  if (stat.size > MAX_INPUT) throw new ToolError(`File is larger than ${MAX_INPUT} bytes`)
  return { body: await fs.readFile(file, "utf8"), file }
}

function parseOrThrow(format: FormatModule, body: string): Parsed {
  const parsed = format.parse(body)
  const errors = parsed.issues.filter((issue) => issue.severity === "error")
  if (errors.length > 0) {
    const first = errors.slice(0, 5).map((issue) => (issue.line ? `line ${issue.line}: ${issue.message}` : issue.message))
    throw new ToolError(`${format.displayName} could not be parsed:\n${first.join("\n")}`)
  }
  return parsed
}

function numericStats(records: ParsedRecord[]): Record<string, { count: number; min: number; max: number; mean: number; sum: number }> {
  const out: Record<string, { count: number; min: number; max: number; mean: number; sum: number }> = {}
  for (const record of records) {
    for (const [key, value] of Object.entries(record.fields)) {
      if (typeof value !== "number" || !Number.isFinite(value)) continue
      const current = out[key]
      if (!current) {
        out[key] = { count: 1, min: value, max: value, mean: value, sum: value }
      } else {
        current.count += 1
        current.sum += value
        current.min = Math.min(current.min, value)
        current.max = Math.max(current.max, value)
        current.mean = current.sum / current.count
      }
    }
  }
  return out
}

function round(value: number): number {
  return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : value
}

export function registerFormatTools(server: McpServer, format: FormatModule): void {
  const sourceArgs = {
    path: z.string().min(1).max(2_000).optional(),
    content: z.string().max(MAX_INPUT).optional(),
    cwd: z.string().min(1).max(2_000).optional(),
  }

  server.tool(
    "detect_files",
    `Find ${format.displayName} files (${format.extensions.join(", ")}) in a directory tree.`,
    {
      path: z.string().min(1).max(2_000).default("."),
      maxDepth: z.number().int().min(0).max(8).default(4),
    },
    async (a) => {
      try {
        const root = path.resolve(a.path)
        const stat = await fs.stat(root)
        if (!stat.isDirectory()) throw new ToolError(`Not a directory: ${root}`)
        const found: string[] = []
        let scanned = 0
        async function walk(dir: string, depth: number): Promise<void> {
          if (depth > a.maxDepth || found.length >= 500) return
          let entries
          try {
            entries = await fs.readdir(dir, { withFileTypes: true })
          } catch {
            return
          }
          for (const entry of entries) {
            if (entry.name.startsWith(".")) continue
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              if (SKIP_DIRS.has(entry.name)) continue
              await walk(full, depth + 1)
              continue
            }
            if (!entry.isFile()) continue
            scanned += 1
            if (!format.extensions.includes(path.extname(entry.name).toLowerCase())) continue
            found.push(path.relative(root, full))
            if (found.length >= 500) return
          }
        }
        await walk(root, 0)
        return text(
          JSON.stringify({ format: format.displayName, root, filesScanned: scanned, matches: found.length, files: found }, null, 2),
        )
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "read_file",
    `Read a ${format.displayName} file, optionally a line range.`,
    {
      path: z.string().min(1).max(2_000),
      startLine: z.number().int().min(1).default(1),
      endLine: z.number().int().min(1).optional(),
      cwd: z.string().min(1).max(2_000).optional(),
    },
    async (a) => {
      try {
        const { body } = await readInput({ path: a.path, cwd: a.cwd })
        const lines = body.split(/\r?\n/)
        const end = Math.min(a.endLine ?? lines.length, lines.length)
        return text(lines.slice(a.startLine - 1, end).join("\n"))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "write_file",
    `Write a ${format.displayName} file. Refuses to overwrite unless overwrite is true.`,
    {
      path: z.string().min(1).max(2_000),
      content: z.string().max(MAX_INPUT),
      overwrite: z.boolean().default(false),
      cwd: z.string().min(1).max(2_000).optional(),
    },
    async (a) => {
      try {
        const file = path.isAbsolute(a.path) ? a.path : path.resolve(a.cwd ? path.resolve(a.cwd) : process.cwd(), a.path)
        if (!a.overwrite) {
          const exists = await fs.stat(file).then(() => true).catch(() => false)
          if (exists) throw new ToolError(`File already exists: ${file}. Set overwrite=true to replace it.`)
        }
        await fs.mkdir(path.dirname(file), { recursive: true })
        await fs.writeFile(file, a.content, "utf8")
        return text(`Wrote ${Buffer.byteLength(a.content)} bytes to ${file}`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "parse",
    `Parse ${format.displayName} into records, fields and document metadata.`,
    { ...sourceArgs },
    async (a) => {
      try {
        const { body, file } = await readInput(a)
        const parsed = parseOrThrow(format, body)
        return text(
          JSON.stringify(
            {
              file: file ?? null,
              format: parsed.format,
              meta: parsed.meta,
              records: parsed.records.length,
              kinds: parsed.records.reduce<Record<string, number>>((acc, record) => {
                acc[record.kind] = (acc[record.kind] ?? 0) + 1
                return acc
              }, {}),
              issues: parsed.issues,
            },
            null,
            2,
          ),
        )
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "validate",
    `Validate ${format.displayName} against its structural rules and report every issue with a line number.`,
    { ...sourceArgs },
    async (a) => {
      try {
        const { body } = await readInput(a)
        const parsed = format.parse(body)
        const errors = parsed.issues.filter((issue) => issue.severity === "error").length
        const warnings = parsed.issues.length - errors
        return text(
          JSON.stringify(
            {
              format: parsed.format,
              valid: errors === 0,
              errors,
              warnings,
              issues: parsed.issues,
            },
            null,
            2,
          ),
        )
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "summarize",
    `Summarize a ${format.displayName} document: metadata, record counts and per-kind totals.`,
    { ...sourceArgs },
    async (a) => {
      try {
        const { body } = await readInput(a)
        const parsed = parseOrThrow(format, body)
        const kinds = parsed.records.reduce<Record<string, number>>((acc, record) => {
          acc[record.kind] = (acc[record.kind] ?? 0) + 1
          return acc
        }, {})
        const lines = [
          `${format.displayName} document`,
          `records: ${parsed.records.length}`,
          ...Object.entries(kinds).map(([kind, count]) => `  ${kind}: ${count}`),
          ...Object.entries(parsed.meta).map(([key, value]) => `${key}: ${String(value)}`),
          `issues: ${parsed.issues.length}`,
        ]
        return text(lines.join("\n"))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "list_records",
    `List ${format.displayName} record ids and kinds, with a limit.`,
    {
      ...sourceArgs,
      limit: z.number().int().min(1).max(1_000).default(50),
    },
    async (a) => {
      try {
        const { body } = await readInput(a)
        const parsed = parseOrThrow(format, body)
        const rows = parsed.records.slice(0, a.limit).map((record) => `${record.kind}\t${record.id}`)
        const rest = parsed.records.length - rows.length
        return text(rows.join("\n") + (rest > 0 ? `\n... ${rest} more` : ""))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "get_record",
    `Return one ${format.displayName} record by id, with all parsed fields.`,
    {
      ...sourceArgs,
      id: z.string().min(1).max(300),
    },
    async (a) => {
      try {
        const { body } = await readInput(a)
        const parsed = parseOrThrow(format, body)
        const record = parsed.records.find((item) => item.id === a.id)
        if (!record) throw new ToolError(`No record with id ${a.id}. Use list_records to see available ids.`)
        return text(JSON.stringify(record, null, 2))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "search",
    `Search ${format.displayName} records by plain text or regular expression.`,
    {
      ...sourceArgs,
      query: z.string().min(1).max(500),
      regex: z.boolean().default(false),
      limit: z.number().int().min(1).max(500).default(50),
    },
    async (a) => {
      try {
        const { body } = await readInput(a)
        const parsed = parseOrThrow(format, body)
        let test: (value: string) => boolean
        if (a.regex) {
          let pattern: RegExp
          try {
            pattern = new RegExp(a.query, "i")
          } catch {
            throw new ToolError(`Invalid regular expression: ${a.query}`)
          }
          test = (value) => pattern.test(value)
        } else {
          const needle = a.query.toLowerCase()
          test = (value) => value.toLowerCase().includes(needle)
        }
        const matches = parsed.records.filter((record) =>
          test(`${record.id} ${record.kind} ${JSON.stringify(record.fields)}`),
        )
        const rows = matches.slice(0, a.limit).map((record) => `${record.kind}\t${record.id}`)
        return text(`${matches.length} match(es)\n${rows.join("\n")}`.trim())
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "stats",
    `Numeric statistics for ${format.displayName} fields across all records.`,
    {
      ...sourceArgs,
      field: z.string().min(1).max(120).optional(),
    },
    async (a) => {
      try {
        const { body } = await readInput(a)
        const parsed = parseOrThrow(format, body)
        const stats = numericStats(parsed.records)
        if (a.field) {
          const one = stats[a.field]
          if (!one) throw new ToolError(`Field ${a.field} has no numeric values. Numeric fields: ${Object.keys(stats).join(", ") || "none"}`)
          return text(JSON.stringify({ [a.field]: { ...one, mean: round(one.mean) } }, null, 2))
        }
        const rounded = Object.fromEntries(
          Object.entries(stats).map(([key, value]) => [key, { ...value, mean: round(value.mean) }]),
        )
        return text(JSON.stringify(rounded, null, 2))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "to_json",
    `Export every parsed ${format.displayName} record as JSON.`,
    { ...sourceArgs },
    async (a) => {
      try {
        const { body, file } = await readInput(a)
        const parsed = parseOrThrow(format, body)
        return text(
          JSON.stringify(
            {
              file: file ?? null,
              format: parsed.format,
              meta: parsed.meta,
              issues: parsed.issues,
              records: parsed.records,
            },
            null,
            2,
          ),
        )
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "diff",
    `Compare two ${format.displayName} documents: added, removed and changed records.`,
    {
      leftPath: z.string().min(1).max(2_000).optional(),
      leftContent: z.string().max(MAX_INPUT).optional(),
      rightPath: z.string().min(1).max(2_000).optional(),
      rightContent: z.string().max(MAX_INPUT).optional(),
      cwd: z.string().min(1).max(2_000).optional(),
    },
    async (a) => {
      try {
        const left = await readInput({ path: a.leftPath, content: a.leftContent, cwd: a.cwd })
        const right = await readInput({ path: a.rightPath, content: a.rightContent, cwd: a.cwd })
        const before = parseOrThrow(format, left.body)
        const after = parseOrThrow(format, right.body)
        const beforeFields = new Map(before.records.map((record) => [record.id, JSON.stringify(record.fields)]))
        const afterFields = new Map(after.records.map((record) => [record.id, JSON.stringify(record.fields)]))
        const added = [...afterFields.keys()].filter((id) => !beforeFields.has(id))
        const removed = [...beforeFields.keys()].filter((id) => !afterFields.has(id))
        const changed = [...afterFields.keys()].filter(
          (id) => beforeFields.has(id) && beforeFields.get(id) !== afterFields.get(id),
        )
        return text(
          JSON.stringify(
            {
              format: before.format,
              added: added.length,
              removed: removed.length,
              changed: changed.length,
              unchanged: afterFields.size - added.length - changed.length,
              records: { added, removed, changed },
              issues: { left: before.issues.length, right: after.issues.length },
            },
            null,
            2,
          ),
        )
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "format_reference",
    `Return a compact ${format.displayName} reference: structure, required fields and common pitfalls.`,
    {},
    async () => text(format.reference),
  )

  server.tool(
    "sample",
    `Return a small but valid ${format.displayName} example document.`,
    {},
    async () => text(format.sample()),
  )
}
