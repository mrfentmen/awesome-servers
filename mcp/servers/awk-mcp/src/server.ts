import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  fail,
  run,
  runChecked,
  text,
  ToolError,
} from "./run.js"

const MAX_INPUT = 2_000_000
const input = z.string().max(MAX_INPUT).default("")
const timeout = z.number().int().min(1_000).max(120_000).default(30_000)
const delimiter = z.string().min(1).max(4).optional()
const file = z.string().min(1).max(2_000).optional()

const awkLit = (value: string): string => JSON.stringify(value)

function fsArgs(separator?: string): string[] {
  return separator ? ["-F", separator] : []
}

function sourceArgs(separator: string | undefined, outputSeparator: string | undefined): string {
  const parts: string[] = []
  if (separator) parts.push(`FS=${awkLit(separator)}`)
  if (outputSeparator) parts.push(`OFS=${awkLit(outputSeparator)}`)
  return parts.length ? `BEGIN{${parts.join(";")}} ` : ""
}

async function awk(args: string[], stdin: string, timeoutMs: number): Promise<string> {
  const result = await run("awk", args, { input: stdin, timeoutMs })
  if (result.code !== 0) {
    throw new ToolError(result.stderr.trim() || `awk exited with code ${result.code}`)
  }
  return result.stdout
}

function inputOrFile(stdin: string, path?: string): { stdin: string; extra: string[] } {
  if (path && stdin.length > 0) throw new ToolError("Use input or file, not both")
  return { stdin: path ? "" : stdin, extra: path ? [path] : [] }
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "awk-mcp", version: "1.0.0" })

  server.tool(
    "run_program",
    "Run an inline AWK program. Use input text or a file, never both.",
    {
      program: z.string().min(1).max(100_000),
      input,
      file,
      fieldSeparator: delimiter,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const source = inputOrFile(a.input, a.file)
        const output = await awk(
          [...fsArgs(a.fieldSeparator), a.program, ...source.extra],
          source.stdin,
          a.timeoutMs,
        )
        return text(output || "(no output)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "run_script_file",
    "Run an AWK program from a .awk file. Use input text or a file, never both.",
    {
      scriptPath: z.string().min(1).max(2_000),
      input,
      file,
      fieldSeparator: delimiter,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const source = inputOrFile(a.input, a.file)
        const output = await awk(
          [...fsArgs(a.fieldSeparator), "-f", a.scriptPath, ...source.extra],
          source.stdin,
          a.timeoutMs,
        )
        return text(output || "(no output)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "check_program",
    "Parse an AWK program without real input and return its syntax errors.",
    {
      program: z.string().min(1).max(100_000),
      fieldSeparator: delimiter,
    },
    async (a) => {
      try {
        await awk([...fsArgs(a.fieldSeparator), a.program, "/dev/null"], "", 30_000)
        return text("AWK syntax OK")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "extract_columns",
    "Print selected 1-based columns from delimited input.",
    {
      input: z.string().min(1).max(MAX_INPUT),
      columns: z.array(z.number().int().min(1).max(100)).min(1).max(30),
      fieldSeparator: delimiter,
      outputSeparator: delimiter,
    },
    async (a) => {
      try {
        const picks = a.columns.map((column) => `$${column}`).join(", ")
        const program = `${sourceArgs(a.fieldSeparator, a.outputSeparator)}{print ${picks}}`
        return text(await awk([...fsArgs(a.fieldSeparator), program], a.input, 30_000))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "filter_rows",
    "Keep rows where an AWK expression is true, e.g. $3 > 10 or $1 == \"ok\".",
    {
      input: z.string().min(1).max(MAX_INPUT),
      condition: z.string().min(1).max(20_000),
      fieldSeparator: delimiter,
      outputSeparator: delimiter,
    },
    async (a) => {
      try {
        const program = `${sourceArgs(a.fieldSeparator, a.outputSeparator)}{if (${a.condition}) print}`
        return text(await awk([...fsArgs(a.fieldSeparator), program], a.input, 30_000))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "sum_column",
    "Sum one numeric column.",
    {
      input: z.string().min(1).max(MAX_INPUT),
      column: z.number().int().min(1).max(100),
      fieldSeparator: delimiter,
    },
    async (a) => {
      try {
        const program = `${sourceArgs(a.fieldSeparator, undefined)}{s += $${a.column}} END{printf "%.6f\\n", s}`
        return text(await awk([...fsArgs(a.fieldSeparator), program], a.input, 30_000))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "average_column",
    "Average one numeric column. Empty input returns 0.",
    {
      input: z.string().min(1).max(MAX_INPUT),
      column: z.number().int().min(1).max(100),
      fieldSeparator: delimiter,
    },
    async (a) => {
      try {
        const program = `${sourceArgs(a.fieldSeparator, undefined)}{s += $${a.column}; c++} END{if (c) printf "%.6f\\n", s / c; else print "0"}`
        return text(await awk([...fsArgs(a.fieldSeparator), program], a.input, 30_000))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "unique_column",
    "Print each distinct value in a column once, in first-seen order.",
    {
      input: z.string().min(1).max(MAX_INPUT),
      column: z.number().int().min(1).max(100),
      fieldSeparator: delimiter,
    },
    async (a) => {
      try {
        const program = `${sourceArgs(a.fieldSeparator, undefined)}!seen[$${a.column}]++ {print $${a.column}}`
        return text(await awk([...fsArgs(a.fieldSeparator), program], a.input, 30_000))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "sort_by_column",
    "Sort lines by one 1-based column, optionally numeric and descending.",
    {
      input: z.string().min(1).max(MAX_INPUT),
      column: z.number().int().min(1).max(100),
      fieldSeparator: delimiter,
      numeric: z.boolean().default(false),
      reverse: z.boolean().default(false),
    },
    async (a) => {
      try {
        const args: string[] = []
        if (a.fieldSeparator) args.push("-t", a.fieldSeparator)
        args.push("-k", `${a.column},${a.column}`)
        if (a.numeric) args.push("-n")
        if (a.reverse) args.push("-r")
        const result = await runChecked("sort", args, { input: a.input, timeoutMs: 30_000 })
        return text(result.stdout)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "join_files",
    "Join two delimited files on numeric key columns.",
    {
      left: z.string().min(1).max(2_000),
      right: z.string().min(1).max(2_000),
      leftKey: z.number().int().min(1).max(100),
      rightKey: z.number().int().min(1).max(100),
      fieldSeparator: delimiter,
      outputSeparator: delimiter,
    },
    async (a) => {
      try {
        const program =
          `${sourceArgs(a.fieldSeparator, a.outputSeparator)}` +
          `NR == FNR {key = $${a.leftKey}; rows[key] = $0; next} ` +
          `{key = $${a.rightKey}; if (key in rows) print rows[key], $0}`
        const result = await run("awk", [...fsArgs(a.fieldSeparator), program, a.left, a.right], {
          timeoutMs: 30_000,
        })
        if (result.code !== 0) {
          throw new ToolError(result.stderr.trim() || `awk exited with code ${result.code}`)
        }
        return text(result.stdout || "(no matching keys)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "count_rows",
    "Count input rows.",
    {
      input: z.string().min(1).max(MAX_INPUT),
      fieldSeparator: delimiter,
    },
    async (a) => {
      try {
        const result = await run("awk", [...fsArgs(a.fieldSeparator), "END{print NR}"], {
          input: a.input,
          timeoutMs: 30_000,
        })
        if (result.code !== 0) throw new ToolError(result.stderr.trim() || "awk failed")
        return text(result.stdout.trim())
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "print_version",
    "Show the local AWK implementation and version when available.",
    {},
    async () => {
      try {
        let result = await run("awk", ["--version"], { timeoutMs: 10_000 })
        if (result.code !== 0) result = await run("awk", ["-W", "version"], { timeoutMs: 10_000 })
        if (result.code === 0) return text((result.stdout || result.stderr).trim())
        const path = await run("which", ["awk"], { timeoutMs: 5_000 })
        return text(`awk is available at ${path.stdout.trim() || "unknown path"}; this build has no version flag`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  return server
}
