import { readdir, readFile, realpath, stat } from "node:fs/promises"
import path from "node:path"

const MAX_FILE_BYTES = 512 * 1024
const MAX_FILES = 120
const MAX_OUTPUT = 14000
const FILES = new Set([
  "package.json", "package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb",
  "Cargo.toml", "Cargo.lock", "go.mod", "go.sum", "pyproject.toml", "poetry.lock", "Pipfile", "Pipfile.lock",
  "requirements.txt", "Gemfile", "Gemfile.lock", "composer.json", "composer.lock", "Dockerfile", "docker-compose.yml",
  "docker-compose.yaml", "compose.yml", "compose.yaml", "flake.nix", "flake.lock", "Makefile",
])
const CI_DIRS = new Set([".github", ".gitlab", ".circleci", ".buildkite"])
const SKIP = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".cache", "vendor"])

export class LensError extends Error {}
type Evidence = { file: string; category: string; signals: string[] }

async function safeRoot(input: string): Promise<string> {
  const configured = process.env.TOOLCHAIN_LENS_ROOT ?? path.join(process.cwd(), "..")
  const allowed = await realpath(path.resolve(configured)).catch(() => path.resolve(configured))
  const requested = path.isAbsolute(input) ? input : path.resolve(allowed, input || ".")
  const target = await realpath(requested).catch(() => requested)
  const relative = path.relative(allowed, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new LensError("Project path must stay inside the configured local workspace")
  return target
}

async function collect(root: string): Promise<string[]> {
  const result: string[] = []
  async function walk(directory: string, depth: number): Promise<void> {
    if (depth > 5 || result.length >= MAX_FILES) return
    let entries
    try { entries = await readdir(directory, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (SKIP.has(entry.name)) continue
      const full = path.join(directory, entry.name)
      const resolved = await realpath(full).catch(() => "")
      if (!resolved) continue
      const relative = path.relative(root, resolved)
      if (relative.startsWith("..") || path.isAbsolute(relative)) continue
      if (entry.isDirectory()) await walk(resolved, depth + 1)
      else if (FILES.has(entry.name) || (relative.startsWith(".github/") && /\.(?:yml|yaml)$/i.test(entry.name))) result.push(relative)
      if (result.length >= MAX_FILES) return
    }
  }
  await walk(root, 0)
  return [...new Set(result)].sort()
}

function packageManager(content: string): string | null {
  const match = content.match(/"packageManager"\s*:\s*"\s*(npm|pnpm|yarn|bun)(?:@[^\"]*)?"/i)
  return match?.[1]?.toLowerCase() ?? null
}
function category(file: string): string {
  if (file.startsWith(".github/") || file.startsWith(".gitlab/") || file.startsWith(".circleci/") || file.startsWith(".buildkite/")) return "ci"
  if (/Dockerfile|compose/i.test(file)) return "container"
  if (/package|pnpm|yarn|bun|Cargo|go\.|poetry|Pipfile|requirements|Gemfile|composer|flake/i.test(file)) return "ecosystem"
  return "tooling"
}
function signals(file: string, content: string): string[] {
  const found: string[] = []
  if (/packageManager/i.test(content)) found.push("declared-package-manager")
  if (/engines\s*[:{]|toolchain|rust-version|requires-python|python_requires/i.test(content)) found.push("runtime-constraint")
  if (/FROM\s+[^\s]+/i.test(content)) found.push("container-base-declared")
  if (/docker|container|podman/i.test(content)) found.push("container-workflow")
  if (/npm ci|pnpm (?:install|frozen-lockfile)|yarn --frozen-lockfile|bun install --frozen|cargo (?:build|test)|poetry install|pip install/i.test(content)) found.push("reproducible-install-command")
  if (/lockfile|lock:\s*true|frozen/i.test(content)) found.push("frozen-or-lockfile-language")
  if (/setup-(?:node|python)|actions\/checkout|cache:\s*(?:npm|yarn|pnpm)/i.test(content)) found.push("ci-runtime-setup")
  return found
}

export async function explain(input: string): Promise<Record<string, unknown>> {
  const root = await safeRoot(input)
  const files = await collect(root)
  const evidence: Evidence[] = []
  const managers = new Set<string>()
  const lockfiles = new Set<string>()
  const categories = new Set<string>()
  for (const file of files) {
    const target = await realpath(path.resolve(root, file)).catch(() => "")
    const info = target ? await stat(target).catch(() => null) : null
    if (!info?.isFile() || info.size > MAX_FILE_BYTES) continue
    const content = await readFile(target, "utf8")
    const kind = category(file)
    categories.add(kind)
    const detected = file === "package.json" ? packageManager(content) : null
    if (detected) managers.add(detected)
    if (/lock(?:\.lock|file)|-lock\.|\.lock$/i.test(file)) lockfiles.add(file)
    evidence.push({ file, category: kind, signals: signals(file, content) })
    if (file === "package-lock.json" || file === "npm-shrinkwrap.json") managers.add("npm")
    if (file === "pnpm-lock.yaml") managers.add("pnpm")
    if (file === "yarn.lock") managers.add("yarn")
    if (/^bun\.lock/.test(file)) managers.add("bun")
    if (file === "Cargo.toml" || file === "Cargo.lock") managers.add("cargo")
    if (file === "go.mod" || file === "go.sum") managers.add("go")
    if (/pyproject|poetry|Pipfile|requirements/.test(file)) managers.add("python")
  }
  const concerns: string[] = []
  if (managers.size > 1) concerns.push("multiple-ecosystem-signals")
  if (categories.has("ci") && !evidence.some((item) => item.signals.includes("ci-runtime-setup"))) concerns.push("ci-without-runtime-setup-signal")
  if (categories.has("container") && !evidence.some((item) => item.signals.includes("container-base-declared"))) concerns.push("container-without-base-signal")
  if (managers.size > 0 && lockfiles.size === 0) concerns.push("ecosystem-without-lockfile-signal")
  return {
    root: "<local-project>",
    files: evidence,
    managers: [...managers].sort(),
    lockfiles: [...lockfiles].sort(),
    categories: [...categories].sort(),
    concerns,
    explanation: concerns.length ? "The project contains toolchain signals that should be reconciled before claiming reproducible builds." : "The project exposes a coherent set of local toolchain signals; verify actual builds separately.",
    valueFree: true,
    warning: "Only filenames, categories, and coarse structural signals are returned. Exact versions, dependency names, command output, environment values, and secret contents are never emitted."
  }
}

export function format(value: unknown): string {
  const output = JSON.stringify(value, null, 2)
  return output.length <= MAX_OUTPUT ? output : JSON.stringify({ error: "Result exceeded the output budget and was reduced.", valueFree: true, truncated: true })
}
