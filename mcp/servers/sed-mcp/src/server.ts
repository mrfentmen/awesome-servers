import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { errorMessage, fail, run, text, ToolError } from "./run.js"

const MAX_INPUT = 2_000_000
const timeout = z.number().int().min(1_000).max(120_000).default(30_000)
const extended = z.boolean().default(false)

function scriptArgs(script: string, useExtended: boolean): string[] {
  return useExtended ? ["-E", "-e", script] : ["-e", script]
}

async function sed(args: string[], stdin: string, timeoutMs: number): Promise<string> {
  const result = await run("sed", args, { input: stdin, timeoutMs })
  if (result.code !== 0) {
    throw new ToolError(result.stderr.trim() || `sed exited with code ${result.code}`)
  }
  return result.stdout
}

function escapeDelimiter(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|")
}

function escapeReplacement(value: string): string {
  return escapeDelimiter(value).replace(/&/g, "\\&")
}

function escapeSlash(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\//g, "\\/").replace(/&/g, "\\&")
}

function countLines(output: string): number {
  if (!output) return 0
  const lines = output.split("\n")
  if (lines[lines.length - 1] === "") lines.pop()
  return lines.length
}

function appendScript(line: number, value: string, command: "a" | "i"): string {
  if (/[\r\n]/.test(value)) throw new ToolError("text must be a single line")
  return `${line}${command}\\\n${value.replace(/\\/g, "\\\\")}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "sed-mcp", version: "1.0.0" })

  server.tool(
    "run_script",
    "Run an arbitrary sed script against input text.",
    {
      script: z.string().min(1).max(50_000),
      input: z.string().max(MAX_INPUT).default(""),
      extended,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        return text(await sed(scriptArgs(a.script, a.extended), a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "run_script_file",
    "Run a sed script file against input text.",
    {
      scriptPath: z.string().min(1).max(2_000),
      input: z.string().max(MAX_INPUT).default(""),
      extended,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const args = a.extended ? ["-E", "-f", a.scriptPath] : ["-f", a.scriptPath]
        return text(await sed(args, a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "check_script",
    "Parse a sed script against empty input and report syntax errors.",
    {
      script: z.string().min(1).max(50_000),
      extended,
    },
    async (a) => {
      try {
        await sed([...scriptArgs(a.script, a.extended), "/dev/null"], "", 15_000)
        return text("sed syntax OK")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "substitute",
    "Replace a regex match with literal replacement text.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      pattern: z.string().min(1).max(20_000),
      replacement: z.string().max(20_000).default(""),
      flags: z.string().regex(/^[gpi0-9]*$/, "Use sed flags such as g, p or i").default("g"),
      extended,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const script = `s|${escapeDelimiter(a.pattern)}|${escapeReplacement(a.replacement)}|${a.flags}`
        return text(await sed(scriptArgs(script, a.extended), a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "delete_lines",
    "Delete lines matching a sed address, e.g. 2,5 or /error/.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      address: z.string().min(1).max(5_000),
      extended,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        return text(await sed(scriptArgs(`${a.address}d`, a.extended), a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "print_lines",
    "Print only lines matching a sed address.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      address: z.string().min(1).max(5_000),
      extended,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        return text(await sed([...scriptArgs(`${a.address}p`, a.extended), "-n"], a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "extract_range",
    "Print an inclusive line range by 1-based line number.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      start: z.number().int().min(1),
      end: z.number().int().min(1),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        if (a.end < a.start) throw new ToolError("end must be greater than or equal to start")
        return text(
          await sed(["-n", "-e", `${a.start},${a.end}p`], a.input, a.timeoutMs),
        )
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "replace_line",
    "Replace one line by 1-based line number with literal text.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      line: z.number().int().min(1),
      value: z.string().max(100_000),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const script = `${a.line}s/.*/${escapeSlash(a.value)}/`
        return text(await sed(scriptArgs(script, false), a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "count_matches",
    "Count lines matching a regex.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      pattern: z.string().min(1).max(20_000),
      extended,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const safe = a.pattern.replace(/\\/g, "\\\\").replace(/\//g, "\\/")
        const output = await sed([...scriptArgs(`/${safe}/p`, a.extended), "-n"], a.input, a.timeoutMs)
        return text(String(countLines(output)))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "strip_blank_lines",
    "Remove blank and whitespace-only lines.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        return text(await sed(["-e", "/^[[:space:]]*$/d"], a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "transform_file",
    "Run a sed script on a file and write the result to a different output file.",
    {
      path: z.string().min(1).max(2_000),
      outputPath: z.string().min(1).max(2_000),
      script: z.string().min(1).max(50_000),
      extended,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const inputPath = resolve(a.path)
        const outputPath = resolve(a.outputPath)
        if (inputPath === outputPath) {
          throw new ToolError("outputPath must be different from path; use a backup or a new file")
        }
        const args = [...scriptArgs(a.script, a.extended), inputPath]
        const output = await sed(args, "", a.timeoutMs)
        await writeFile(outputPath, output, "utf8")
        return text(`Wrote ${outputPath}`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool("print_version", "Show the local sed implementation/version.", {}, async () => {
    try {
      const version = await run("sed", ["--version"], { timeoutMs: 10_000 })
      if (version.code === 0) return text(version.stdout.trim())
      const path = await run("which", ["sed"], { timeoutMs: 5_000 })
      return text(
        `BSD sed at ${path.stdout.trim() || "unknown path"} (this build has no --version flag)`,
      )
    } catch (error) {
      return fail(errorMessage(error))
    }
  })

  server.tool(
    "insert_line",
    "Insert one line before a 1-based line number.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      line: z.number().int().min(1),
      text: z.string().max(100_000),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        return text(
          await sed(["-e", appendScript(a.line, a.text, "i")], a.input, a.timeoutMs),
        )
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "append_line",
    "Append one line after a 1-based line number.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      line: z.number().int().min(1),
      text: z.string().max(100_000),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        return text(
          await sed(["-e", appendScript(a.line, a.text, "a")], a.input, a.timeoutMs),
        )
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "translate_chars",
    "Translate characters with sed y; source and target must be the same length.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      source: z.string().min(1).max(2_000),
      target: z.string().min(1).max(2_000),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        if ([...a.source].length !== [...a.target].length) {
          throw new ToolError("source and target must have the same character length")
        }
        const script = `y/${escapeSlash(a.source)}/${escapeSlash(a.target)}/`
        return text(await sed(scriptArgs(script, false), a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "number_lines",
    "Print only the 1-based line numbers for input lines.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        return text(await sed(["-n", "="], a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "normalize_whitespace",
    "Collapse runs of whitespace to one space and trim each line.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        return text(
          await sed(
            ["-e", "s/[[:space:]][[:space:]]*/ /g", "-e", "s/^ //", "-e", "s/[[:space:]]*$//"],
            a.input,
            a.timeoutMs,
          ),
        )
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "remove_comments",
    "Delete lines whose first non-space character is a comment marker.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      prefix: z.string().regex(/^[#;]+$/, "Use # or ; as the comment prefix").default("#"),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const script = `/^[[:space:]]*${a.prefix}/d`
        return text(await sed(scriptArgs(script, false), a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "join_lines",
    "Join all lines into one line, separated by a chosen text.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      separator: z.string().max(1_000).default(" "),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const args = [
          "-e",
          ":a",
          "-e",
          "N",
          "-e",
          "$!ba",
          "-e",
          `s/\\n/${escapeSlash(a.separator)}/g`,
        ]
        return text(await sed(args, a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "delete_range",
    "Delete an inclusive range of 1-based line numbers.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      start: z.number().int().min(1),
      end: z.number().int().min(1),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        if (a.end < a.start) throw new ToolError("end must be greater than or equal to start")
        return text(await sed(["-e", `${a.start},${a.end}d`], a.input, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  return server
}
