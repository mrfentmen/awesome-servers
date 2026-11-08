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
const variables = z.record(z.string()).default({})

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

function variableArgs(values: Record<string, string>): string[] {
  return Object.entries(values).flatMap(([key, value]) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new ToolError(`Invalid AWK variable name: ${key}`)
    }
    return ["-v", `${key}=${value}`]
  })
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

  server.tool(
    "run_with_variables",
    "Run an AWK program with named -v variable assignments.",
    {
      program: z.string().min(1).max(100_000),
      variables,
      input,
      file,
      fieldSeparator: delimiter,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const source = inputOrFile(a.input, a.file)
        const output = await awk(
          [...variableArgs(a.variables), ...fsArgs(a.fieldSeparator), a.program, ...source.extra],
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
    "match_rows",
    "Keep rows whose whole line matches an AWK regular expression.",
    {
      input: z.string().min(1).max(MAX_INPUT),
      pattern: z.string().min(1).max(20_000),
      invert: z.boolean().default(false),
      fieldSeparator: delimiter,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const program = `${sourceArgs(a.fieldSeparator, undefined)}${a.invert ? "!" : ""}($0 ~ re) {print}`
        const output = await awk(
          [...fsArgs(a.fieldSeparator), "-v", `re=${a.pattern}`, program],
          a.input,
          a.timeoutMs,
        )
        return text(output || "(no matches)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "replace_text",
    "Replace every regex match on each line with literal replacement text.",
    {
      input: z.string().min(1).max(MAX_INPUT),
      pattern: z.string().min(1).max(20_000),
      replacement: z.string().max(100_000).default(""),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const program =
          "function replaceAll(s, re, rep, n, a, out, i) {" +
          " n = split(s, a, re); out = a[1];" +
          " for (i = 2; i <= n; i++) out = out rep a[i]; return out }" +
          " { print replaceAll($0, p, r) }"
        const output = await awk(
          ["-v", `p=${a.pattern}`, "-v", `r=${a.replacement}`, program],
          a.input,
          a.timeoutMs,
        )
        return text(output)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "group_count",
    "Count rows per value in one column, preserving first-seen order.",
    {
      input: z.string().min(1).max(MAX_INPUT),
      column: z.number().int().min(1).max(100),
      fieldSeparator: delimiter,
      outputSeparator: delimiter,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const program =
          `${sourceArgs(a.fieldSeparator, a.outputSeparator)}` +
          `{ key = $${a.column}; if (!seen[key]++) order[++n] = key; count[key]++ } ` +
          `END { for (i = 1; i <= n; i++) print order[i], count[order[i]] }`
        return text(await awk([...fsArgs(a.fieldSeparator), program], a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "column_stats",
    "Report count, sum, min, max and mean for one numeric column.",
    {
      input: z.string().min(1).max(MAX_INPUT),
      column: z.number().int().min(1).max(100),
      fieldSeparator: delimiter,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const program =
          `${sourceArgs(a.fieldSeparator, undefined)}` +
          `{ v = $${a.column} + 0; if (n == 0 || v < min) min = v; if (n == 0 || v > max) max = v; sum += v; n++ } ` +
          `END { if (n == 0) { print "count=0" } else { printf "count=%d\\nsum=%.6f\\nmin=%.6f\\nmax=%.6f\\nmean=%.6f\\n", n, sum, min, max, sum / n } }`
        return text(await awk([...fsArgs(a.fieldSeparator), program], a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "distinct_count",
    "Count distinct values in one column.",
    {
      input: z.string().min(1).max(MAX_INPUT),
      column: z.number().int().min(1).max(100),
      fieldSeparator: delimiter,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const program = `${sourceArgs(a.fieldSeparator, undefined)}{ if (!seen[$${a.column}]++) n++ } END { print n }`
        return text(await awk([...fsArgs(a.fieldSeparator), program], a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "number_lines",
    "Prefix each line with its 1-based line number and a tab.",
    {
      input: z.string().min(1).max(MAX_INPUT),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        return text(await awk([`{ printf "%d\\t%s\\n", NR, $0 }`], a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "dedupe_lines",
    "Remove duplicate whole lines, preserving first-seen order.",
    {
      input: z.string().min(1).max(MAX_INPUT),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        return text(await awk([`!seen[$0]++ { print }`], a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  return server
}
