import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { errorMessage, fail, run, text, ToolError } from "./run.js"

const MAX_INPUT = 2_000_000
const timeout = z.number().int().min(1_000).max(120_000).default(30_000)
const name = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Use a valid M4 macro name")
const defines = z.record(z.string()).default({})
const includePath = z.array(z.string().min(1).max(2_000)).max(20).default([])

function options(
  macros: Record<string, string>,
  includes: string[],
  prefixAll: boolean,
): string[] {
  const args: string[] = []
  if (prefixAll) args.push("-P")
  for (const [macro, value] of Object.entries(macros)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(macro)) {
      throw new ToolError(`Invalid macro name: ${macro}`)
    }
    args.push("-D", `${macro}=${value}`)
  }
  for (const path of includes) args.push("-I", path)
  return args
}

async function m4(args: string[], stdin: string, timeoutMs: number): Promise<string> {
  const result = await run("m4", args, { input: stdin, timeoutMs })
  if (result.code !== 0) {
    throw new ToolError(result.stderr.trim() || `m4 exited with code ${result.code}`)
  }
  return result.stdout
}

function quoteM4(value: string): string {
  if (value.includes("`") || value.includes("'")) {
    throw new ToolError("M4 values cannot contain backticks or single quotes")
  }
  return `\`${value}'`
}

function macroCall(name: string, args: string[]): string {
  return `${name}(${args.map(quoteM4).join(", ")})\n`
}

async function macroDefinition(name: string): Promise<string> {
  const result = await run("m4", [], { input: `dumpdef(\`${name}')\n`, timeoutMs: 15_000 })
  if (result.code !== 0) {
    throw new ToolError(result.stderr.trim() || `m4 exited with code ${result.code}`)
  }
  return (result.stdout || result.stderr)
    .split("\n")
    .filter((line) => line.includes(`${name}:`))
    .join("\n")
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "m4-mcp", version: "1.0.0" })

  server.tool(
    "expand",
    "Preprocess M4 input with optional -D definitions, -I include paths and -P prefixing.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      defines,
      includePath,
      prefixAll: z.boolean().default(false),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const output = await m4(
          options(a.defines, a.includePath, a.prefixAll),
          a.input,
          a.timeoutMs,
        )
        return text(output || "(no output)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "expand_file",
    "Preprocess an M4 file with optional definitions and include paths.",
    {
      path: z.string().min(1).max(2_000),
      defines,
      includePath,
      prefixAll: z.boolean().default(false),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const output = await m4(
          [...options(a.defines, a.includePath, a.prefixAll), a.path],
          "",
          a.timeoutMs,
        )
        return text(output || "(no output)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "check_syntax",
    "Run M4 over input and return any preprocessing errors. M4 treats unknown macros as text.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      defines,
      includePath,
    },
    async (a) => {
      try {
        await m4(options(a.defines, a.includePath, false), a.input, 30_000)
        return text("M4 preprocessing OK")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool("list_macros", "List the built-in and predefined M4 macros.", {}, async () => {
    try {
      const result = await run("m4", [], { input: "dumpdef\n", timeoutMs: 15_000 })
      const output = (result.stdout || result.stderr).trim()
      return text(output || "No macros reported by this M4")
    } catch (error) {
      return fail(errorMessage(error))
    }
  })

  server.tool(
    "dump_macro",
    "Dump one macro definition, if the local M4 supports --dumpdef.",
    { name },
    async (a) => {
      try {
        const output = (await macroDefinition(a.name)).trim()
        return text(output || `Macro ${a.name} is not defined`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "trace_macro",
    "Trace calls to one macro while preprocessing input.",
    {
      name,
      input: z.string().max(MAX_INPUT).default(""),
      defines,
      includePath,
    },
    async (a) => {
      try {
        const result = await run(
          "m4",
          ["-t", a.name, ...options(a.defines, a.includePath, false)],
          { input: a.input, timeoutMs: 30_000 },
        )
        if (result.code !== 0) {
          throw new ToolError(result.stderr.trim() || `m4 exited with code ${result.code}`)
        }
        const trace = result.stderr.trim()
        return text([result.stdout, trace ? `trace:\n${trace}` : ""].filter(Boolean).join("\n"))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "define",
    "Preprocess input with one extra -D definition.",
    {
      name,
      value: z.string().max(100_000).default(""),
      input: z.string().max(MAX_INPUT).default(""),
      includePath,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const output = await m4(
          ["-D", `${a.name}=${a.value}`, ...options({}, a.includePath, false)],
          a.input,
          a.timeoutMs,
        )
        return text(output || "(no output)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "undefine",
    "Preprocess input after undefining one macro with -U.",
    {
      name,
      input: z.string().max(MAX_INPUT).default(""),
      includePath,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const output = await m4(
          ["-U", a.name, ...options({}, a.includePath, false)],
          a.input,
          a.timeoutMs,
        )
        return text(output || "(no output)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "include_file",
    "Preprocess a file while allowing includes from extra search paths.",
    {
      path: z.string().min(1).max(2_000),
      includePath,
      defines,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const output = await m4(
          [...options(a.defines, a.includePath, false), a.path],
          "",
          a.timeoutMs,
        )
        return text(output || "(no output)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "prefix_all",
    "Preprocess input with -P, prefixing all built-in macros with m4_.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      defines,
      includePath,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const output = await m4(
          options(a.defines, a.includePath, true),
          a.input,
          a.timeoutMs,
        )
        return text(output || "(no output)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool("print_version", "Show the local M4 version.", {}, async () => {
    try {
      const result = await run("m4", ["--version"], { timeoutMs: 10_000 })
      if (result.code !== 0) throw new ToolError(result.stderr.trim() || "m4 --version failed")
      return text(result.stdout.trim())
    } catch (error) {
      return fail(errorMessage(error))
    }
  })

  server.tool(
    "check_file",
    "Preprocess a file and report any M4 errors.",
    {
      path: z.string().min(1).max(2_000),
      defines,
      includePath,
    },
    async (a) => {
      try {
        await m4([...options(a.defines, a.includePath, false), resolve(a.path)], "", 30_000)
        return text("M4 file preprocessing OK")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "trace_file",
    "Trace calls to one macro while preprocessing a file.",
    {
      name,
      path: z.string().min(1).max(2_000),
      defines,
      includePath,
    },
    async (a) => {
      try {
        const result = await run(
          "m4",
          ["-t", a.name, ...options(a.defines, a.includePath, false), resolve(a.path)],
          { timeoutMs: 30_000 },
        )
        if (result.code !== 0) {
          throw new ToolError(result.stderr.trim() || `m4 exited with code ${result.code}`)
        }
        const trace = result.stderr.trim()
        return text([result.stdout, trace ? `trace:\n${trace}` : ""].filter(Boolean).join("\n"))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "run_macro",
    "Invoke one M4 macro with quoted arguments and return its expansion.",
    {
      name,
      args: z.array(z.string().max(100_000)).max(20).default([]),
      defines,
      includePath,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const output = await m4(
          options(a.defines, a.includePath, false),
          macroCall(a.name, a.args),
          a.timeoutMs,
        )
        return text(output || "(no output)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "run_macro_file",
    "Load a macro file, invoke one macro with arguments and return the expansion.",
    {
      path: z.string().min(1).max(2_000),
      name,
      args: z.array(z.string().max(100_000)).max(20).default([]),
      defines,
      includePath,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const source = await readFile(resolve(a.path), "utf8")
        const output = await m4(
          options(a.defines, a.includePath, false),
          `${source}\n${macroCall(a.name, a.args)}`,
          a.timeoutMs,
        )
        return text(output || "(no output)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "expand_to_file",
    "Preprocess M4 input and write the expansion to a file.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      outputPath: z.string().min(1).max(2_000),
      defines,
      includePath,
      prefixAll: z.boolean().default(false),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const output = await m4(
          options(a.defines, a.includePath, a.prefixAll),
          a.input,
          a.timeoutMs,
        )
        const outputPath = resolve(a.outputPath)
        await writeFile(outputPath, output, "utf8")
        return text(`Wrote ${outputPath}`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "evaluate",
    "Evaluate a safe M4 arithmetic expression.",
    {
      expression: z
        .string()
        .min(1)
        .max(1_000)
        .regex(/^[0-9+\-*/%()<>=!&|~^ \t]+$/, "Use an M4 arithmetic expression"),
    },
    async (a) => {
      try {
        const output = await m4([], `eval(${a.expression})\n`, 15_000)
        return text(output.trim() || "(no output)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "regex_replace",
    "Replace regex matches with literal text using M4 patsubst.",
    {
      input: z.string().max(MAX_INPUT).default(""),
      pattern: z.string().min(1).max(20_000),
      replacement: z.string().max(100_000).default(""),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const source = `patsubst(${quoteM4(a.input)}, ${quoteM4(a.pattern)}, ${quoteM4(a.replacement)})\n`
        return text((await m4([], source, a.timeoutMs)) || "(no output)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "change_quotes",
    "Preprocess input after changing M4 quote delimiters.",
    {
      open: z.string().min(1).max(8),
      close: z.string().min(1).max(8),
      input: z.string().max(MAX_INPUT).default(""),
      defines,
      includePath,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const source = `changequote(${quoteM4(a.open)}, ${quoteM4(a.close)})dnl\n${a.input}\n`
        const output = await m4(options(a.defines, a.includePath, false), source, a.timeoutMs)
        return text(output || "(no output)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "macro_exists",
    "Check whether one macro is defined in the local M4.",
    { name },
    async (a) => {
      try {
        return text((await macroDefinition(a.name)).trim() ? "defined" : "not defined")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  return server
}
