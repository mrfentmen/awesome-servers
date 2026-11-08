import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { access, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { homedir, tmpdir } from "node:os"
import { join, resolve } from "node:path"
import {
  errorMessage,
  fail,
  requireCommand,
  run,
  runChecked,
  text,
  ToolError,
} from "./run.js"

const quote = (value: string): string =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`

const appName = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[A-Za-z0-9 ._-]+$/, "Use an app name, not a path")

const timeout = z.number().int().min(1_000).max(120_000).default(30_000)

async function osa(script: string, timeoutMs = 30_000): Promise<string> {
  const result = await run("osascript", ["-e", script], { timeoutMs })
  if (result.code !== 0) {
    throw new ToolError(result.stderr.trim() || `osascript exited with code ${result.code}`)
  }
  return result.stdout.trim()
}

async function osaFile(path: string, args: string[], timeoutMs = 30_000): Promise<string> {
  const result = await run("osascript", [path, ...args], { timeoutMs })
  if (result.code !== 0) {
    throw new ToolError(result.stderr.trim() || `osascript exited with code ${result.code}`)
  }
  return result.stdout.trim()
}

async function osaWithArgs(script: string, args: string[], timeoutMs = 30_000): Promise<string> {
  const result = await run("osascript", ["-e", script, "--", ...args], { timeoutMs })
  if (result.code !== 0) {
    throw new ToolError(result.stderr.trim() || `osascript exited with code ${result.code}`)
  }
  return result.stdout.trim()
}

async function appPath(name: string): Promise<string> {
  const candidates = [
    join("/Applications", `${name}.app`),
    join("/System/Applications", `${name}.app`),
    join("/System/Library/CoreServices", `${name}.app`),
    join("/System/Library/CoreServices/Applications", `${name}.app`),
    join(homedir(), "Applications", `${name}.app`),
  ]
  for (const candidate of candidates) {
    try {
      await access(candidate)
      return candidate
    } catch {
      // Try the next standard app location.
    }
  }
  throw new ToolError(`Could not find ${name}.app in the standard application folders`)
}

async function dictionaryText(name: string): Promise<string> {
  const path = await appPath(name)
  const resources = join(path, "Contents", "Resources")
  try {
    const files = await readdir(resources)
    const sdefs = files.filter((file) => file.endsWith(".sdef"))
    if (sdefs.length) {
      return (await Promise.all(sdefs.map((file) => readFile(join(resources, file), "utf8")))).join("\n")
    }
  } catch {
    // Fall through to sdef, which can also read dictionaries outside Resources.
  }
  const result = await run("sdef", [path], { timeoutMs: 30_000 })
  if (result.code === 0 && result.stdout.trim()) return result.stdout
  throw new ToolError(result.stderr.trim() || `No AppleScript dictionary found for ${name}`)
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "applescript-mcp", version: "1.0.0" })

  server.tool(
    "run_script",
    "Run an AppleScript string with osascript. The script can control apps and the system; run only trusted code.",
    { script: z.string().min(1).max(200_000), timeoutMs: timeout },
    async (a) => {
      try {
        return text(await osa(a.script, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "run_script_file",
    "Run an AppleScript .scpt or .applescript file with optional argv values.",
    {
      path: z.string().min(1).max(2_000),
      args: z.array(z.string().max(2_000)).max(50).default([]),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        return text(await osaFile(resolve(a.path), a.args, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "check_syntax",
    "Compile an AppleScript without running it. Returns OK or the compiler error.",
    { script: z.string().min(1).max(200_000) },
    async (a) => {
      const dir = await mkdtemp(join(tmpdir(), "applescript-mcp-"))
      try {
        await requireCommand("osacompile")
        await runChecked("osacompile", ["-e", a.script, "-o", join(dir, "check.scpt")], {
          timeoutMs: 30_000,
        })
        return text("AppleScript syntax OK")
      } catch (error) {
        return fail(errorMessage(error))
      } finally {
        await rm(dir, { recursive: true, force: true })
      }
    },
  )

  server.tool(
    "compile_script",
    "Compile an AppleScript string to a .scpt file without running it.",
    {
      script: z.string().min(1).max(200_000),
      outputPath: z.string().min(1).max(2_000),
    },
    async (a) => {
      try {
        await requireCommand("osacompile")
        const output = resolve(a.outputPath)
        await runChecked("osacompile", ["-e", a.script, "-o", output], { timeoutMs: 30_000 })
        return text(`Compiled AppleScript to ${output}`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "run_handler",
    "Run one named AppleScript handler from a script, passing string or number arguments.",
    {
      script: z.string().min(1).max(200_000),
      handler: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Use a valid AppleScript handler name"),
      args: z.array(z.union([z.string(), z.number()])).max(20).default([]),
      timeoutMs: timeout,
    },
    async (a) => {
      const dir = await mkdtemp(join(tmpdir(), "applescript-mcp-"))
      const file = join(dir, "handler.applescript")
      const callArgs = a.args
        .map((value) => (typeof value === "number" ? String(value) : quote(value)))
        .join(", ")
      const source = `${a.script}\n\non run argv\n  return ${a.handler}(${callArgs})\nend run\n`
      try {
        await writeFile(file, source, "utf8")
        return text(await osaFile(file, [], a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      } finally {
        await rm(dir, { recursive: true, force: true })
      }
    },
  )

  server.tool(
    "list_running_apps",
    "List visible foreground applications currently running.",
    {},
    async () => {
      try {
        const output = await osa(
          'tell application "System Events" to get name of every process whose background only is false',
        )
        const apps = output
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean)
        return text(apps.length ? apps.join("\n") : "No foreground apps reported")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "get_app_info",
    "Check whether an app is running and whether it is frontmost and visible.",
    { app: appName },
    async (a) => {
      try {
        return text(
          await osa(
            `tell application "System Events"\n` +
              `if exists application process ${quote(a.app)} then\n` +
              `tell application process ${quote(a.app)} to return "running, frontmost=" & (frontmost as text) & ", visible=" & (visible as text)\n` +
              `else\nreturn "not running"\nend if\nend tell`,
          ),
        )
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "get_app_dictionary",
    "Read an installed app's AppleScript dictionary with sdef.",
    { app: appName },
    async (a) => {
      try {
        const body = (await dictionaryText(a.app)).trim()
        return text(body.slice(0, 30_000) || "The app returned an empty dictionary")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "tell_app",
    "Send one raw AppleScript command to an app. The command is executed inside a tell block.",
    {
      app: appName,
      command: z.string().min(1).max(20_000),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        return text(await osa(`tell application ${quote(a.app)} to ${a.command}`, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "display_dialog",
    "Show a macOS dialog and return the button the user chose.",
    {
      message: z.string().min(1).max(10_000),
      title: z.string().max(500).optional(),
      buttons: z.array(z.string().min(1).max(80)).min(1).max(4).default(["OK"]),
      defaultButton: z.string().max(80).optional(),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        let script = `display dialog ${quote(a.message)}`
        if (a.title) script += ` with title ${quote(a.title)}`
        script += ` buttons {${a.buttons.map(quote).join(", ")}}`
        if (a.defaultButton) script += ` default button ${quote(a.defaultButton)}`
        return text(await osa(script, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "display_notification",
    "Show a macOS notification. This does not wait for the user.",
    {
      message: z.string().min(1).max(2_000),
      title: z.string().min(1).max(200).default("AppleScript MCP"),
      subtitle: z.string().max(200).optional(),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        let script = `display notification ${quote(a.message)} with title ${quote(a.title)}`
        if (a.subtitle) script += ` subtitle ${quote(a.subtitle)}`
        await osa(script, a.timeoutMs)
        return text("Notification sent")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool("get_clipboard", "Read plain text from the macOS clipboard.", {}, async () => {
    try {
      return text(await osa("the clipboard as text"))
    } catch (error) {
      return fail(errorMessage(error))
    }
  })

  server.tool(
    "set_clipboard",
    "Replace the macOS clipboard with plain text.",
    { value: z.string().max(1_000_000) },
    async (a) => {
      try {
        await runChecked("pbcopy", [], { input: a.value, timeoutMs: 10_000 })
        return text(`Copied ${a.value.length} characters to the clipboard`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "open_app",
    "Open an installed macOS app by name.",
    { app: appName },
    async (a) => {
      try {
        await runChecked("open", ["-a", a.app], { timeoutMs: 15_000 })
        return text(`Opened ${a.app}`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "quit_app",
    "Ask an app to quit. Unsaved work may prompt the app.",
    { app: appName },
    async (a) => {
      try {
        await osa(`tell application ${quote(a.app)} to quit`)
        return text(`Asked ${a.app} to quit`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "system_info",
    "Return the macOS system info record (OS version, model, CPU, memory).",
    {},
    async () => {
      try {
        return text(await osa("system info"))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "run_script_with_args",
    "Run AppleScript with argv values. The script must read them from 'on run argv'.",
    {
      script: z.string().min(1).max(200_000),
      args: z.array(z.string().max(2_000)).max(50).default([]),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        return text(await osaWithArgs(a.script, a.args, a.timeoutMs))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "compile_app",
    "Compile an AppleScript string into a runnable .app bundle.",
    {
      script: z.string().min(1).max(200_000),
      outputPath: z.string().min(1).max(2_000).regex(/\.app$/i, "outputPath must end in .app"),
    },
    async (a) => {
      try {
        await requireCommand("osacompile")
        const output = resolve(a.outputPath)
        await runChecked("osacompile", ["-e", a.script, "-o", output], { timeoutMs: 30_000 })
        return text(`Compiled AppleScript app to ${output}`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "decompile_script",
    "Turn a compiled .scpt or .app AppleScript back into source text.",
    { path: z.string().min(1).max(2_000) },
    async (a) => {
      try {
        await requireCommand("osadecompile")
        const result = await runChecked("osadecompile", [resolve(a.path)], { timeoutMs: 30_000 })
        return text(result.stdout.trim().slice(0, 30_000) || "The script returned no source")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "search_app_dictionary",
    "Search an app's AppleScript dictionary for a class, command, property or term.",
    {
      app: appName,
      term: z.string().min(1).max(200),
      maxResults: z.number().int().min(1).max(100).default(20),
    },
    async (a) => {
      try {
        const body = await dictionaryText(a.app)
        const needle = a.term.toLowerCase()
        const matches = body
          .split("\n")
          .map((line, index) => ({ line: line.trim(), index }))
          .filter((item) => item.line.toLowerCase().includes(needle))
          .slice(0, a.maxResults)
          .map((item) => `${item.index + 1}: ${item.line}`)
        return text(matches.length ? matches.join("\n") : `No dictionary entries matched ${a.term}`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  return server
}
