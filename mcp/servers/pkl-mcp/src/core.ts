import { promises as fs } from "node:fs"
import path from "node:path"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import type { CommandSpec, LanguageConfig } from "./types.js"
import { errorMessage, fail, run, text, ToolError } from "./run.js"

const MAX_INPUT = 2_000_000
const DEFAULT_TIMEOUT = 30_000
const SKIP_DIRS = new Set([".git", ".mcp-build", "build", "dist", "node_modules", "vendor"])

interface Source {
  content: string
  file?: string
  cwd: string
}

interface CommandContext {
  file: string
  dir: string
  build: string
  stem: string
  ext: string
}

interface ProjectScan {
  files: number
  byExtension: Record<string, number>
  markers: Record<string, number>
  samples: string[]
}

function resolveDir(value?: string): string {
  return path.resolve(value && value.length > 0 ? value : process.cwd())
}

function resolveFile(file: string, cwd: string): string {
  if (file.includes("\0")) throw new ToolError("Path contains a null byte")
  return path.isAbsolute(file) ? file : path.resolve(cwd, file)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

async function fileExists(file: string): Promise<boolean> {
  try {
    await fs.stat(file)
    return true
  } catch {
    return false
  }
}

async function readFileSafe(file: string): Promise<string> {
  const stat = await fs.stat(file)
  if (!stat.isFile()) throw new ToolError(`Not a file: ${file}`)
  if (stat.size > MAX_INPUT) throw new ToolError(`File is larger than ${MAX_INPUT} bytes`)
  return fs.readFile(file, "utf8")
}

async function loadSource(input: {
  path?: string
  content?: string
  cwd?: string
}): Promise<Source> {
  const cwd = resolveDir(input.cwd)
  if (input.path && input.content !== undefined) {
    throw new ToolError("Use path or content, not both")
  }
  if (input.content !== undefined) {
    return { content: input.content, cwd }
  }
  if (!input.path) throw new ToolError("Provide a source path or content")
  const file = resolveFile(input.path, cwd)
  return { content: await readFileSafe(file), file, cwd: path.dirname(file) }
}

function commandContext(file: string, cwd: string, config: LanguageConfig): CommandContext {
  const ext = path.extname(file)
  return {
    file,
    dir: cwd,
    build: path.join(cwd, config.buildDir ?? ".mcp-build"),
    stem: path.basename(file, ext),
    ext,
  }
}

function expandCommand(spec: CommandSpec, ctx: CommandContext): CommandSpec {
  const values: Record<string, string> = {
    file: ctx.file,
    dir: ctx.dir,
    build: ctx.build,
    stem: ctx.stem,
    ext: ctx.ext,
  }
  const replace = (value: string): string =>
    value.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole)
  return {
    command: replace(spec.command),
    args: spec.args.map(replace),
    timeoutMs: spec.timeoutMs,
  }
}

async function commandAvailable(command: string): Promise<boolean> {
  const result = await run("which", [command], { timeoutMs: 5_000 })
  return result.code === 0
}

async function runSteps(
  steps: CommandSpec[],
  ctx: CommandContext,
  cwd: string,
  timeoutMs: number,
): Promise<string> {
  let output = ""
  for (const step of steps) {
    const expanded = expandCommand(step, ctx)
    const result = await run(expanded.command, expanded.args, {
      cwd,
      timeoutMs: step.timeoutMs ?? timeoutMs,
    })
    output += result.stdout
    if (result.stderr.trim().length > 0) {
      if (output.length > 0 && !output.endsWith("\n")) output += "\n"
      output += result.stderr
    }
    if (result.code !== 0) {
      throw new ToolError(
        (result.stderr || result.stdout || `${expanded.command} exited with code ${result.code}`).trim(),
      )
    }
  }
  return output
}

async function pickWorkflow(steps: CommandSpec[]): Promise<CommandSpec[]> {
  if (steps.length === 0) throw new ToolError("No command is configured")
  if (await commandAvailable(steps[0].command)) return steps
  throw new ToolError(
    `${steps[0].command} is not installed or not on PATH. Install one of: ${[
      ...new Set(steps.map((step) => step.command)),
    ].join(", ")}`,
  )
}

async function ensureBuildDir(ctx: CommandContext): Promise<void> {
  await fs.mkdir(ctx.build, { recursive: true })
}

function scanStructure(content: string, config: LanguageConfig): string[] {
  const issues: string[] = []
  const stack: Array<{ char: string; line: number }> = []
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" }
  const opens = new Set(["(", "[", "{"])
  const quotes = config.stringQuotes ?? ['"']
  let inString: string | null = null
  let stringLine = 0
  let escaped = false
  let line = 1

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]
    const rest = content.slice(index)

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === inString) {
        inString = null
      }
      if (char === "\n") line += 1
      continue
    }

    if (config.blockComment && rest.startsWith(config.blockComment.start)) {
      const end = content.indexOf(config.blockComment.end, index + config.blockComment.start.length)
      if (end === -1) {
        issues.push(`Line ${line}: unclosed block comment`)
        break
      }
      const skipped = content.slice(index, end + config.blockComment.end.length)
      line += (skipped.match(/\n/g) ?? []).length
      index = end + config.blockComment.end.length - 1
      continue
    }

    if (config.comment && rest.startsWith(config.comment)) {
      const newline = content.indexOf("\n", index)
      if (newline === -1) break
      index = newline
      line += 1
      continue
    }

    if (quotes.includes(char)) {
      inString = char
      stringLine = line
      escaped = false
      continue
    }

    if (char === "\n") line += 1
    if (opens.has(char)) {
      stack.push({ char, line })
    } else if (char in pairs) {
      const open = stack.pop()
      if (!open) {
        issues.push(`Line ${line}: unexpected ${char}`)
      } else if (open.char !== pairs[char]) {
        issues.push(`Line ${line}: ${char} closes ${open.char} from line ${open.line}`)
      }
    }
  }

  if (inString) issues.push(`Line ${stringLine}: unclosed string`)
  for (const item of stack.slice(-5)) issues.push(`Line ${item.line}: unclosed ${item.char}`)
  return issues
}

function cleanFormat(content: string, expandTabs: boolean, indentWidth: number): string {
  const normalized = content.replace(/\r\n?/g, "\n")
  const lines = normalized.split("\n").map((line) => {
    const noTrailing = line.replace(/[ \t]+$/, "")
    return expandTabs ? noTrailing.replace(/\t/g, " ".repeat(indentWidth)) : noTrailing
  })
  const body = lines.join("\n").replace(/\n+$/, "")
  return body.length > 0 ? `${body}\n` : ""
}

async function scanProject(
  dir: string,
  config: LanguageConfig,
  maxDepth: number,
): Promise<ProjectScan> {
  const scan: ProjectScan = { files: 0, byExtension: {}, markers: {}, samples: [] }
  const root = path.resolve(dir)

  async function walk(current: string, depth: number): Promise<void> {
    if (depth > maxDepth || scan.files >= 2_000) return
    let entries
    try {
      entries = await fs.readdir(current, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".") && entry.name !== ".env") continue
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue
        await walk(full, depth + 1)
        continue
      }
      if (!entry.isFile()) continue
      const ext = path.extname(entry.name).toLowerCase()
      const isMarker = config.markers.includes(entry.name)
      if (!config.extensions.includes(ext) && !isMarker) continue
      scan.files += 1
      if (ext) scan.byExtension[ext] = (scan.byExtension[ext] ?? 0) + 1
      if (isMarker) scan.markers[entry.name] = (scan.markers[entry.name] ?? 0) + 1
      if (scan.samples.length < 20) scan.samples.push(path.relative(root, full))
      if (scan.files >= 2_000) return
    }
  }

  await walk(root, 0)
  return scan
}

export function registerLanguageTools(server: McpServer, config: LanguageConfig): void {
  const sourceArgs = {
    path: z.string().min(1).max(2_000).optional(),
    content: z.string().max(MAX_INPUT).optional(),
    cwd: z.string().min(1).max(2_000).optional(),
  }
  const timeout = z.number().int().min(1_000).max(120_000).default(DEFAULT_TIMEOUT)

  server.tool(
    "detect_project",
    `Find ${config.displayName} files, project markers and the toolchain layout in a directory.`,
    {
      path: z.string().min(1).max(2_000).default("."),
      maxDepth: z.number().int().min(0).max(8).default(3),
    },
    async (a) => {
      try {
        const root = resolveDir(a.path)
        const stat = await fs.stat(root)
        if (!stat.isDirectory()) throw new ToolError(`Not a directory: ${root}`)
        const scan = await scanProject(root, config, a.maxDepth)
        return text(
          JSON.stringify(
            {
              language: config.displayName,
              root,
              extensions: config.extensions,
              markers: config.markers,
              files: scan.files,
              byExtension: scan.byExtension,
              markerFiles: scan.markers,
              samples: scan.samples,
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
    "read_source",
    `Read a ${config.displayName} source file, optionally a line range.`,
    {
      path: z.string().min(1).max(2_000),
      startLine: z.number().int().min(1).default(1),
      endLine: z.number().int().min(1).optional(),
      cwd: z.string().min(1).max(2_000).optional(),
    },
    async (a) => {
      try {
        const file = resolveFile(a.path, resolveDir(a.cwd))
        const content = await readFileSafe(file)
        const lines = content.split("\n")
        const end = Math.min(a.endLine ?? lines.length, lines.length)
        const body = lines.slice(a.startLine - 1, end).join("\n")
        return text(body)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "write_source",
    `Write a ${config.displayName} source file. Refuses to overwrite unless overwrite is true.`,
    {
      path: z.string().min(1).max(2_000),
      content: z.string().max(MAX_INPUT),
      overwrite: z.boolean().default(false),
      createDirs: z.boolean().default(true),
      cwd: z.string().min(1).max(2_000).optional(),
    },
    async (a) => {
      try {
        const file = resolveFile(a.path, resolveDir(a.cwd))
        if (!a.overwrite && (await fileExists(file))) {
          throw new ToolError(`File already exists: ${file}. Set overwrite=true to replace it.`)
        }
        if (a.createDirs) await fs.mkdir(path.dirname(file), { recursive: true })
        await fs.writeFile(file, a.content, "utf8")
        return text(`Wrote ${Buffer.byteLength(a.content)} bytes to ${file}`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "syntax_check",
    `Check ${config.displayName} structure and, when configured, run the real parser without executing the program.`,
    {
      ...sourceArgs,
    },
    async (a) => {
      try {
        const source = await loadSource(a)
        const issues = scanStructure(source.content, config)
        let parserChecked = false
        if (config.syntax && source.file) {
          const ctx = commandContext(source.file, source.cwd, config)
          const command = expandCommand(config.syntax, ctx)
          const result = await run(command.command, command.args, {
            cwd: source.cwd,
            timeoutMs: DEFAULT_TIMEOUT,
          })
          parserChecked = result.code === 0
          if (result.code !== 0) {
            issues.push((result.stderr || result.stdout || "parser rejected the file").trim())
          }
        }
        if (issues.length > 0) throw new ToolError(issues.join("\n"))
        return text(parserChecked ? "Syntax OK (parser accepted the file)" : "Syntax OK (structure check)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "format_source",
    `Trim trailing whitespace, normalize line endings and ensure a final newline in ${config.displayName} code.`,
    {
      ...sourceArgs,
      expandTabs: z.boolean().default(false),
      indentWidth: z.number().int().min(2).max(8).default(2),
      write: z.boolean().default(false),
    },
    async (a) => {
      try {
        const source = await loadSource(a)
        const formatted = cleanFormat(source.content, a.expandTabs, a.indentWidth)
        if (a.write && source.file) {
          await fs.writeFile(source.file, formatted, "utf8")
          return text(`Formatted ${source.file}`)
        }
        return text(formatted)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "lint_source",
    `Check ${config.displayName} code for trailing whitespace, tabs, long lines, missing final newline and unbalanced structure.`,
    {
      ...sourceArgs,
      maxLineLength: z.number().int().min(40).max(400).default(120),
    },
    async (a) => {
      try {
        const source = await loadSource(a)
        const issues: string[] = []
        const lines = source.content.replace(/\r\n?/g, "\n").split("\n")
        lines.forEach((line, index) => {
          if (/[ \t]+$/.test(line)) issues.push(`Line ${index + 1}: trailing whitespace`)
          if (!config.allowTabs && line.includes("\t")) issues.push(`Line ${index + 1}: tab character`)
          if (line.length > a.maxLineLength) {
            issues.push(`Line ${index + 1}: ${line.length} characters (max ${a.maxLineLength})`)
          }
        })
        if (source.content.length > 0 && !source.content.endsWith("\n")) {
          issues.push("File does not end with a newline")
        }
        issues.push(...scanStructure(source.content, config))
        if (issues.length === 0) return text("No lint issues")
        return text(issues.join("\n"))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "extract_symbols",
    `List functions, classes, types and other ${config.displayName} definitions with line numbers.`,
    {
      ...sourceArgs,
    },
    async (a) => {
      try {
        const source = await loadSource(a)
        const found: string[] = []
        const lines = source.content.split("\n")
        for (const rule of config.symbols) {
          const regex = new RegExp(rule.pattern, rule.flags ?? "i")
          lines.forEach((line, index) => {
            const match = regex.exec(line)
            if (match) found.push(`Line ${index + 1}: ${rule.kind} ${match[1] ?? match[0]}`)
          })
        }
        return text(found.length > 0 ? found.join("\n") : "No symbols found")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "list_imports",
    `List imports, includes and dependencies in a ${config.displayName} source file.`,
    {
      ...sourceArgs,
    },
    async (a) => {
      try {
        const source = await loadSource(a)
        const found: string[] = []
        const lines = source.content.split("\n")
        for (const rule of config.imports) {
          const regex = new RegExp(rule.pattern, rule.flags ?? "i")
          lines.forEach((line, index) => {
            const match = regex.exec(line)
            if (match) found.push(`Line ${index + 1}: ${rule.kind} ${match[1] ?? match[0]}`)
          })
        }
        return text(found.length > 0 ? found.join("\n") : "No imports found")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "list_todos",
    `Find TODO, FIXME, HACK and XXX comments in ${config.displayName} code.`,
    {
      ...sourceArgs,
    },
    async (a) => {
      try {
        const source = await loadSource(a)
        const found: string[] = []
        source.content.split("\n").forEach((line, index) => {
          if (/\b(TODO|FIXME|HACK|XXX)\b/i.test(line)) found.push(`Line ${index + 1}: ${line.trim()}`)
        })
        return text(found.length > 0 ? found.join("\n") : "No TODO comments found")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "find_references",
    `Find every mention of a symbol in one ${config.displayName} source file.`,
    {
      path: z.string().min(1).max(2_000),
      symbol: z.string().min(1).max(200),
      cwd: z.string().min(1).max(2_000).optional(),
    },
    async (a) => {
      try {
        const file = resolveFile(a.path, resolveDir(a.cwd))
        const content = await readFileSafe(file)
        const regex = new RegExp(
          `(?<![A-Za-z0-9_])${escapeRegExp(a.symbol)}(?![A-Za-z0-9_])`,
          "g",
        )
        const found: string[] = []
        content.split("\n").forEach((line, index) => {
          const count = [...line.matchAll(regex)].length
          if (count > 0) found.push(`Line ${index + 1}: ${count} reference(s)`)
        })
        return text(found.length > 0 ? found.join("\n") : `No references to ${a.symbol}`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "rename_symbol",
    `Rename one symbol in a ${config.displayName} file. Defaults to a dry run.`,
    {
      path: z.string().min(1).max(2_000),
      oldName: z.string().min(1).max(200),
      newName: z.string().min(1).max(200),
      dryRun: z.boolean().default(true),
      cwd: z.string().min(1).max(2_000).optional(),
    },
    async (a) => {
      try {
        if (/[\r\n]/.test(a.newName)) throw new ToolError("New name cannot contain a newline")
        const file = resolveFile(a.path, resolveDir(a.cwd))
        const content = await readFileSafe(file)
        const regex = new RegExp(
          `(?<![A-Za-z0-9_])${escapeRegExp(a.oldName)}(?![A-Za-z0-9_])`,
          "g",
        )
        const count = [...content.matchAll(regex)].length
        if (count === 0) return text(`No references to ${a.oldName}`)
        if (a.dryRun) return text(`Dry run: would replace ${count} occurrence(s) in ${file}`)
        await fs.writeFile(file, content.replace(regex, () => a.newName), "utf8")
        return text(`Renamed ${count} occurrence(s) in ${file}`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "insert_snippet",
    `Insert a real ${config.displayName} starter snippet into a file. Defaults to a dry run.`,
    {
      path: z.string().min(1).max(2_000),
      snippet: z.string().min(1).max(80),
      line: z.number().int().min(1).optional(),
      dryRun: z.boolean().default(true),
      cwd: z.string().min(1).max(2_000).optional(),
    },
    async (a) => {
      try {
        const file = resolveFile(a.path, resolveDir(a.cwd))
        const snippet = config.snippets[a.snippet]
        if (!snippet) {
          throw new ToolError(
            `Unknown snippet: ${a.snippet}. Available: ${Object.entries(config.snippets)
              .map(([key, value]) => `${key} (${value.description})`)
              .join(", ")}`,
          )
        }
        const content = await readFileSafe(file)
        const lines = content.split("\n")
        const index = a.line ? Math.min(a.line - 1, lines.length) : lines.length
        lines.splice(index, 0, ...snippet.body.split("\n"))
        const next = lines.join("\n")
        if (a.dryRun) {
          return text(`Dry run: would insert ${a.snippet} at line ${index + 1} in ${file}`)
        }
        await fs.writeFile(file, next, "utf8")
        return text(`Inserted ${a.snippet} at line ${index + 1} in ${file}`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "comment_lines",
    `Comment a line range in ${config.displayName} code using the language comment marker.`,
    {
      ...sourceArgs,
      startLine: z.number().int().min(1).default(1),
      endLine: z.number().int().min(1).optional(),
      write: z.boolean().default(false),
    },
    async (a) => {
      try {
        const source = await loadSource(a)
        const lines = source.content.split("\n")
        const end = Math.min(a.endLine ?? lines.length, lines.length)
        let changed = 0
        for (let index = a.startLine - 1; index < end; index += 1) {
          if (lines[index].trim().length > 0 && !lines[index].trimStart().startsWith(config.comment)) {
            const indent = lines[index].slice(0, lines[index].length - lines[index].trimStart().length)
            lines[index] = `${indent}${config.comment} ${lines[index].slice(indent.length)}`
            changed += 1
          }
        }
        const next = lines.join("\n")
        if (a.write && source.file) {
          await fs.writeFile(source.file, next, "utf8")
          return text(`Commented ${changed} line(s) in ${source.file}`)
        }
        return text(next)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "uncomment_lines",
    `Remove the ${config.displayName} comment marker from a line range.`,
    {
      ...sourceArgs,
      startLine: z.number().int().min(1).default(1),
      endLine: z.number().int().min(1).optional(),
      write: z.boolean().default(false),
    },
    async (a) => {
      try {
        const source = await loadSource(a)
        const lines = source.content.split("\n")
        const end = Math.min(a.endLine ?? lines.length, lines.length)
        let changed = 0
        for (let index = a.startLine - 1; index < end; index += 1) {
          const match = lines[index].match(/^(\s*)(.*)$/)
          if (!match) continue
          const indent = match[1]
          const rest = match[2]
          if (!rest.startsWith(config.comment)) continue
          const after = rest.slice(config.comment.length)
          lines[index] = `${indent}${after.startsWith(" ") ? after.slice(1) : after}`
          changed += 1
        }
        const next = lines.join("\n")
        if (a.write && source.file) {
          await fs.writeFile(source.file, next, "utf8")
          return text(`Uncommented ${changed} line(s) in ${source.file}`)
        }
        return text(next)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "scaffold_project",
    `Create a small runnable ${config.displayName} project with a starter file and test directory.`,
    {
      path: z.string().min(1).max(2_000).default("."),
      projectName: z.string().min(1).max(120).optional(),
      overwrite: z.boolean().default(false),
    },
    async (a) => {
      try {
        const root = resolveDir(a.path)
        const name = a.projectName ?? config.slug
        if (!/^[A-Za-z0-9_.-]+$/.test(name)) throw new ToolError("Invalid project name")
        const created: string[] = []
        for (const file of config.scaffold) {
          const relative = file.path.replace(/\{\{name\}\}/g, name)
          const normalized = path.normalize(relative)
          if (path.isAbsolute(normalized) || normalized.startsWith("..")) {
            throw new ToolError(`Unsafe scaffold path: ${relative}`)
          }
          const target = path.join(root, normalized)
          if (!a.overwrite && (await fileExists(target))) {
            throw new ToolError(`File already exists: ${target}`)
          }
          await fs.mkdir(path.dirname(target), { recursive: true })
          await fs.writeFile(target, file.content.replace(/\{\{name\}\}/g, name), "utf8")
          created.push(normalized)
        }
        return text(`Created ${created.length} file(s):\n${created.join("\n")}`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "run_source",
    `Run a ${config.displayName} file with the installed interpreter or compiler.`,
    {
      path: z.string().min(1).max(2_000),
      cwd: z.string().min(1).max(2_000).optional(),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        if (!config.runner || config.runner.length === 0) {
          throw new ToolError(`No runner is configured for ${config.displayName}`)
        }
        const file = resolveFile(a.path, resolveDir(a.cwd))
        const cwd = path.dirname(file)
        const ctx = commandContext(file, cwd, config)
        await ensureBuildDir(ctx)
        const workflow = await pickWorkflow(config.runner)
        const output = await runSteps(workflow, ctx, cwd, a.timeoutMs)
        return text(output.trim().length > 0 ? output : "(no output)")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "run_tests",
    `Run the configured ${config.displayName} test command in a project directory.`,
    {
      cwd: z.string().min(1).max(2_000).default("."),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        if (!config.test || config.test.length === 0) {
          throw new ToolError(`No test command is configured for ${config.displayName}`)
        }
        const cwd = resolveDir(a.cwd)
        const ctx = commandContext(path.join(cwd, config.slug), cwd, config)
        await ensureBuildDir(ctx)
        const output = await runSteps(config.test, ctx, cwd, a.timeoutMs)
        return text(output.trim().length > 0 ? output : "Tests passed")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "build_project",
    `Build a ${config.displayName} project with the configured compiler command.`,
    {
      cwd: z.string().min(1).max(2_000).default("."),
      path: z.string().min(1).max(2_000).optional(),
      timeoutMs: timeout,
    },
    async (a) => {
      try {
        if (!config.build || config.build.length === 0) {
          throw new ToolError(`No build step is configured for ${config.displayName}`)
        }
        const cwd = resolveDir(a.cwd)
        let file = a.path ? resolveFile(a.path, cwd) : ""
        if (!file) {
          const scan = await scanProject(cwd, config, 3)
          const first = scan.samples.find((sample) =>
            config.extensions.includes(path.extname(sample).toLowerCase()),
          )
          if (first) file = path.join(cwd, first)
        }
        const ctx = commandContext(file || path.join(cwd, config.slug), cwd, config)
        await ensureBuildDir(ctx)
        const output = await runSteps(config.build, ctx, cwd, a.timeoutMs)
        return text(output.trim().length > 0 ? output : "Build passed")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "toolchain_status",
    `Show which ${config.displayName} compilers, interpreters, build tools and test commands are installed.`,
    {},
    async () => {
      try {
        const commands = new Set<string>()
        for (const step of [
          ...(config.runner ?? []),
          ...(config.syntax ? [config.syntax] : []),
          ...(config.build ?? []),
          ...(config.test ?? []),
        ]) {
          commands.add(step.command)
        }
        const lines: string[] = []
        for (const command of [...commands].sort()) {
          if (!(await commandAvailable(command))) {
            lines.push(`${command}: not found`)
            continue
          }
          const version = await run(command, ["--version"], { timeoutMs: 5_000 })
          const first = (version.stdout || version.stderr).split("\n").find((line) => line.trim().length > 0)
          lines.push(`${command}: ${first?.trim() ?? "installed"}`)
        }
        return text(lines.join("\n") || "No toolchain commands configured")
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "language_reference",
    `Return a compact ${config.displayName} syntax and toolchain reference for agents.`,
    {},
    async () => text(config.reference),
  )

}
