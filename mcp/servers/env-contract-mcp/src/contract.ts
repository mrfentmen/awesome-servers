import { readFile, realpath } from "node:fs/promises"
import path from "node:path"

const MAX_FILE_BYTES = 512 * 1024
const MAX_FILES = 100
const MAX_NAMES = 500
const MAX_OUTPUT = 14000
const ALLOWED_FILES = /(^|\/)(\.env(?:\.[\w.-]+)?|docker-compose(?:\.[\w.-]+)?\.ya?ml|compose(?:\.[\w.-]+)?\.ya?ml|package\.json|.*\.(?:ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|rb|yml|yaml))$/i
const NAME = /\b[A-Z][A-Z0-9_]{1,127}\b/g
const RESERVED = new Set(["JSON", "HTTP", "HTTPS", "TRUE", "FALSE", "NULL", "NODE", "PATH", "HOME", "USER", "PORT"])

export class ContractError extends Error {}

type Kind = "env-example" | "dotenv" | "config" | "source"

async function safeRoot(input: string): Promise<string> {
  const configured = process.env.ENV_CONTRACT_ROOT ?? path.join(process.cwd(), "..")
  const root = await realpath(path.resolve(configured)).catch(() => path.resolve(configured))
  const target = await realpath(path.resolve(input || ".")).catch(() => path.resolve(input || "."))
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new ContractError(`Project path must stay inside ${root}`)
  return target
}

function kind(file: string): Kind { if (/\.env(?:\.|$)/i.test(file)) return /\.env\.example$/i.test(file) ? "env-example" : "dotenv"; return /\.(?:ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|rb)$/i.test(file) ? "source" : "config" }
function names(text: string): string[] { return [...new Set((text.match(NAME) ?? []).filter((value) => !RESERVED.has(value) && !/^\d+$/.test(value)))].slice(0, MAX_NAMES) }
function declared(text: string): string[] { return [...new Set(text.split(/\r?\n/).map((line) => line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]{1,127})\s*(?:=|:|$)/)?.[1]).filter((value): value is string => Boolean(value)))].slice(0, MAX_NAMES) }
async function files(root: string): Promise<string[]> {
  const result: string[] = []
  async function walk(directory: string, depth: number): Promise<void> {
    if (depth > 5 || result.length >= MAX_FILES) return
    let entries
    try { entries = await (await import("node:fs/promises")).readdir(directory, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (entry.name.startsWith(".") && !entry.name.startsWith(".env")) continue
      if (["node_modules", "dist", ".git", "coverage", "build"].includes(entry.name)) continue
      const full = path.join(directory, entry.name)
      const resolved = await realpath(full).catch(() => "")
      if (!resolved) continue
      const relativeResolved = path.relative(root, resolved)
      if (relativeResolved.startsWith("..") || path.isAbsolute(relativeResolved)) continue
      if (entry.isDirectory()) await walk(resolved, depth + 1)
      else if (ALLOWED_FILES.test(relativeResolved)) result.push(resolved)
      if (result.length >= MAX_FILES) return
    }
  }
  await walk(root, 0)
  return result
}

export async function analyze(project: string): Promise<Record<string, unknown>> {
  const root = await safeRoot(project)
  const all = await files(root)
  const declarations = new Map<string, string[]>()
  const references = new Map<string, string[]>()
  const fileKinds: Record<string, Kind> = {}
  let read = 0
  for (const file of all) {
    const relative = path.relative(root, file)
    fileKinds[relative] = kind(relative)
    let text: string
    try {
      const buffer = await readFile(file)
      if (buffer.byteLength > MAX_FILE_BYTES) continue
      text = buffer.toString("utf8")
    } catch { continue }
    read += 1
    const found = names(text)
    const type = fileKinds[relative]
    if (type === "env-example" || type === "dotenv") declarations.set(relative, declared(text))
    if (type === "source" || type === "config") references.set(relative, found.filter((value) => /ENV|KEY|TOKEN|SECRET|URL|HOST|PORT|MODE|REGION|DATABASE|REDIS|AWS|GITHUB|NPM|API/i.test(value)))
  }
  const declaredNames = [...new Set([...declarations.values()].flat())].sort()
  const referencedNames = [...new Set([...references.values()].flat())].sort()
  const missing = referencedNames.filter((value) => !declaredNames.includes(value)).slice(0, MAX_NAMES)
  const unused = declaredNames.filter((value) => !referencedNames.includes(value)).slice(0, MAX_NAMES)
  return { root, filesScanned: read, declarations: Object.fromEntries(declarations), references: Object.fromEntries(references), declaredNames, referencedNames, missing, unused, valueFree: true, warning: "Only variable names and file paths are reported. Environment values are never read or emitted; matches are heuristic and not a complete build validation." }
}

export function format(value: unknown): string { return JSON.stringify(value, null, 2).slice(0, MAX_OUTPUT) }
