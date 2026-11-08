import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
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
      const result = await run("m4", ["--dumpdef"], { input: "", timeoutMs: 15_000 })
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
        const result = await run("m4", [`--dumpdef=${a.name}`], {
          input: "",
          timeoutMs: 15_000,
        })
        const output = (result.stdout || result.stderr).trim()
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

  return server
}
