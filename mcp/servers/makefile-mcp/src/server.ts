import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { readdir, readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { errorMessage, fail, run, text, ToolError } from "./run.js"

const timeout = z.number().int().min(1_000).max(300_000).default(120_000)
const cwd = z.string().min(1).max(2_000).optional()
const makefile = z.string().min(1).max(2_000).default("Makefile")
const target = z.string().min(1).max(300).optional()
const variables = z.record(z.string()).default({})

function workdir(value?: string): string {
  return resolve(value ?? process.cwd())
}

function makefilePath(name: string, dir: string): string {
  return resolve(dir, name)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function varArgs(values: Record<string, string>): string[] {
  return Object.entries(values).map(([key, value]) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new ToolError(`Invalid make variable name: ${key}`)
    }
    return `${key}=${value}`
  })
}

async function source(name: string, dir: string): Promise<string> {
  return readFile(makefilePath(name, dir), "utf8")
}

async function make(
  name: string,
  dir: string,
  args: string[],
  timeoutMs: number,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return run("make", ["-f", name, ...args], { cwd: dir, timeoutMs })
}

async function makeOutput(
  name: string,
  dir: string,
  args: string[],
  timeoutMs: number,
): Promise<string> {
  const result = await make(name, dir, args, timeoutMs)
  if (result.code !== 0) {
    throw new ToolError((result.stderr || result.stdout).trim() || `make exited with code ${result.code}`)
  }
  return result.stdout
}

function targetsFrom(textValue: string): string[] {
  const found = new Set<string>()
  for (const line of textValue.split("\n")) {
    const match = /^([A-Za-z0-9_.%/-]+)\s*:(?!=)/.exec(line)
    if (match) found.add(match[1])
  }
  return [...found].sort()
}

function variablesFrom(textValue: string): string[] {
  const found: string[] = []
  for (const line of textValue.split("\n")) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*(::=|:=|\?=|\+=|=)\s*(.*)$/.exec(line)
    if (match) found.push(`${match[1]} ${match[2]} ${match[3]}`)
  }
  return found
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "makefile-mcp", version: "1.0.0" })

  server.tool(
    "list_targets",
    "List target names defined in a Makefile, sorted and deduplicated.",
    { makefile, cwd },
    async (a) => {
      try {
        const found = targetsFrom(await source(a.makefile, workdir(a.cwd)))
        return text(found.length ? found.join("\n") : "No targets found")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "show_target_recipe",
    "Show the tab-indented recipe lines for one Makefile target.",
    {
      target: z.string().min(1).max(300),
      makefile,
      cwd,
    },
    async (a) => {
      try {
        const lines = (await source(a.makefile, workdir(a.cwd))).split("\n")
        const start = lines.findIndex((line) =>
          new RegExp(`^${escapeRegExp(a.target)}\\s*:(?!=)`).test(line),
        )
        if (start < 0) throw new ToolError(`Target not found: ${a.target}`)
        const recipe: string[] = []
        for (const line of lines.slice(start + 1)) {
          if (line.startsWith("\t")) recipe.push(line.slice(1))
          else if (line.trim() === "") continue
          else break
        }
        return text(recipe.length ? recipe.join("\n") : `Target ${a.target} has no recipe`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "show_variables",
    "Show variable assignments in a Makefile. Values are not expanded.",
    { makefile, cwd },
    async (a) => {
      try {
        const found = variablesFrom(await source(a.makefile, workdir(a.cwd)))
        return text(found.length ? found.join("\n") : "No variable assignments found")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "list_makefiles",
    "List Makefile, makefile, GNUmakefile and *.mk files in a directory.",
    { cwd },
    async (a) => {
      try {
        const entries = await readdir(workdir(a.cwd))
        const found = entries
          .filter((name) => /^(GNUmakefile|Makefile|makefile)$/.test(name) || name.endsWith(".mk"))
          .sort()
        return text(found.length ? found.join("\n") : "No makefiles found")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "dry_run",
    "Run make with -n to show what a target would do without executing recipes.",
    { target, makefile, cwd, variables, timeoutMs: timeout },
    async (a) => {
      try {
        const args = ["-n", ...varArgs(a.variables), ...(a.target ? [a.target] : [])]
        const output = await makeOutput(a.makefile, workdir(a.cwd), args, a.timeoutMs)
        return text(output || "No commands would run")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "run_target",
    "Run one Makefile target. Recipes can execute arbitrary commands.",
    { target: z.string().min(1).max(300), makefile, cwd, variables, timeoutMs: timeout },
    async (a) => {
      try {
        const output = await makeOutput(
          a.makefile,
          workdir(a.cwd),
          [...varArgs(a.variables), a.target],
          a.timeoutMs,
        )
        return text(output || `Target ${a.target} completed with no output`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "run_default",
    "Run make's default target.",
    { makefile, cwd, variables, timeoutMs: timeout },
    async (a) => {
      try {
        const output = await makeOutput(
          a.makefile,
          workdir(a.cwd),
          varArgs(a.variables),
          a.timeoutMs,
        )
        return text(output || "Default target completed with no output")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "run_jobs",
    "Run make with a parallel job count from 1 to 16.",
    {
      target,
      jobs: z.number().int().min(1).max(16).default(2),
      makefile,
      cwd,
      variables,
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        const output = await makeOutput(
          a.makefile,
          workdir(a.cwd),
          [`-j${a.jobs}`, ...varArgs(a.variables), ...(a.target ? [a.target] : [])],
          a.timeoutMs,
        )
        return text(output || "Make completed with no output")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "check_makefile",
    "Parse a Makefile with a dry run and report common syntax errors.",
    { makefile, cwd, timeoutMs: timeout },
    async (a) => {
      try {
        const result = await make(a.makefile, workdir(a.cwd), ["-n"], a.timeoutMs)
        const errors = result.stderr.trim()
        if (/missing separator|recipe commences|unterminated|invalid syntax/i.test(errors)) {
          return fail(errors)
        }
        if (result.code !== 0) {
          return text(
            `Makefile parsed; make exited ${result.code}.` +
              (errors ? `\n${errors}` : " No default target may be defined."),
          )
        }
        return text("Makefile parsed; dry run OK")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "show_database",
    "Print make's internal database for a Makefile, capped at 30,000 characters.",
    { makefile, cwd, timeoutMs: timeout },
    async (a) => {
      try {
        const result = await make(a.makefile, workdir(a.cwd), ["-p", "-n"], a.timeoutMs)
        const output = (result.stdout || result.stderr).trim()
        if (!output) throw new ToolError("make returned an empty database")
        return text(output.slice(0, 30_000))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "show_include_files",
    "List include, -include and sinclude directives from a Makefile.",
    { makefile, cwd },
    async (a) => {
      try {
        const lines = (await source(a.makefile, workdir(a.cwd))).split("\n")
        const includes = lines
          .map((line) => /^\s*(?:-?include|sinclude)\s+(.+)$/.exec(line)?.[1])
          .filter((value): value is string => Boolean(value))
        return text(includes.length ? includes.join("\n") : "No include directives found")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool("print_version", "Show the local GNU Make version.", {}, async () => {
    try {
      const result = await run("make", ["--version"], { timeoutMs: 10_000 })
      if (result.code !== 0) throw new ToolError(result.stderr.trim() || "make --version failed")
      return text(result.stdout.trim())
    } catch (error) {
      return fail(errorMessage(error))
    }
  })

  return server
}
