import { readdir, readFile, realpath, stat } from "node:fs/promises"
import path from "node:path"

// ---- muxB tools:
const TRACKED_FILES = new Set([
  "package.json", "package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb",
  "Cargo.toml", "Cargo.lock", "go.mod", "go.sum", "pyproject.toml", "poetry.lock", "Pipfile", "Pipfile.lock",
  "requirements.txt", "Gemfile", "Gemfile.lock", "composer.json", "composer.lock", "Dockerfile", "docker-compose.yml",
  "docker-compose.yaml", "compose.yml", "compose.yaml", "flake.nix", "flake.lock", "Makefile",
])
const CI_DIRS = [".github", ".gitlab", ".circleci", ".buildkite"]
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".cache", "vendor"])
const MAX_FILES = 120
const MAX_FILE_BYTES = 512 * 1024
const MAX_DEPTH = 5
const ECOSYSTEMS = ["node", "python", "rust", "go", "ruby", "dotnet", "php", "container", "ci"] as const
const CAPABILITIES = [
  { key: "runtime-constraint", label: "pinned runtime", test: (content: string) => /engines\s*[:{]|toolchain|rust-version|requires-python|python_requires|\.nvmrc|jvmTarget|target\s*[=:]\s*["']?\d/i.test(content) },
  { key: "lockfile", label: "lockfile present", test: (_content: string, file: string) => /lock(?:\.lock|file)|-lock\.|\.lock$/i.test(file) },
  { key: "reproducible-install", label: "frozen install", test: (content: string) => /npm ci|pnpm (?:install|frozen-lockfile)|yarn --frozen-lockfile|bun install --frozen|cargo (?:build|test)|poetry install|pip install/i.test(content) },
  { key: "container-base", label: "container base", test: (content: string) => /FROM\s+[^\s]+/i.test(content) },
  { key: "container-workflow", label: "container workflow", test: (content: string) => /docker|container|podman/i.test(content) },
  { key: "ci-runtime-setup", label: "ci runtime setup", test: (content: string) => /setup-(?:node|python)|actions\/checkout|cache:\s*(?:npm|yarn|pnpm)/i.test(content) },
  { key: "declared-manager", label: "declared package manager", test: (content: string) => /packageManager/i.test(content) },
  { key: "integrity-checksums", label: "integrity checksums", test: (content: string) => /integrity|sha512|sha256|checksum/i.test(content) },
] as const

function pad(label: string, width = 22): string {
  return label.length >= width ? label : label + " ".repeat(width - label.length)
}

function ecosystemOf(file: string, content: string): string | null {
  const name = file.split("/").pop() ?? file
  if (/^(?:bun\.lock|bun\.lockb|package\.json|package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock)$/i.test(name)) return "node"
  if (/^Cargo\.(?:toml|lock)$/i.test(name)) return "rust"
  if (/^(?:go\.mod|go\.sum)$/i.test(name)) return "go"
  if (/^(?:pyproject\.toml|poetry\.lock|Pipfile|Pipfile\.lock|requirements\.txt)$/i.test(name)) return "python"
  if (/^(?:Gemfile|Gemfile\.lock)$/i.test(name)) return "ruby"
  if (/^(?:composer\.json|composer\.lock)$/i.test(name)) return "php"
  if (/^Dockerfile/i.test(name) || /^(?:docker-)?compose\.ya?ml$/i.test(name)) return "container"
  if (/^flake\.(?:nix|lock)$/i.test(name)) return "rust"
  if (CI_DIRS.some((dir) => file.startsWith(`${dir}/`))) return "ci"
  if (/^global\.json$/i.test(name) || /\b(?:dotnet|nuget)\b/i.test(content)) return "dotnet"
  return null
}

async function collect(root: string): Promise<string[]> {
  const result: string[] = []
  async function walk(directory: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH || result.length >= MAX_FILES) return
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue
      const full = path.join(directory, entry.name)
      const resolved = await realpath(full).catch(() => "")
      if (!resolved) continue
      const relative = path.relative(root, resolved)
      if (relative.startsWith("..") || path.isAbsolute(relative)) continue
      if (entry.isDirectory()) await walk(resolved, depth + 1)
      else if (TRACKED_FILES.has(entry.name) || (CI_DIRS.some((dir) => relative.startsWith(`${dir}/`)) && /\.(?:yml|yaml)$/i.test(entry.name))) result.push(relative)
      if (result.length >= MAX_FILES) return
    }
  }
  await walk(root, 0)
  return [...new Set(result)].sort()
}

export async function reproducibilityGapMatrix(args: { project?: string }): Promise<string> {
  const configured = process.env.TOOLCHAIN_LENS_ROOT ?? path.join(process.cwd(), "..")
  const allowed = await realpath(path.resolve(configured)).catch(() => path.resolve(configured))
  const requested = path.isAbsolute(args.project ?? "") ? path.resolve(args.project ?? "") : path.resolve(allowed, args.project ?? ".")
  const target = await realpath(requested).catch(() => requested)
  if (path.relative(allowed, target).startsWith("..")) throw new Error("Project path must stay inside the configured local workspace")
  const files = await collect(target)
  const matrix = new Map<string, Map<string, boolean>>()
  const ecosystemFiles = new Map<string, number>()
  let read = 0
  for (const file of files) {
    const full = await realpath(path.resolve(target, file)).catch(() => "")
    const info = full ? await stat(full).catch(() => null) : null
    if (!info?.isFile() || info.size > MAX_FILE_BYTES) continue
    const content = await readFile(full, "utf8")
    read += 1
    const ecosystem = ecosystemOf(file, content)
    if (!ecosystem) continue
    ecosystemFiles.set(ecosystem, (ecosystemFiles.get(ecosystem) ?? 0) + 1)
    for (const capability of CAPABILITIES) {
      if (!capability.test(content, file)) continue
      const row = matrix.get(capability.key) ?? new Map<string, boolean>()
      row.set(ecosystem, true)
      matrix.set(capability.key, row)
    }
  }
  const present = ECOSYSTEMS.filter((ecosystem) => ecosystemFiles.has(ecosystem))
  const out: string[] = []
  out.push(`Reproducibility capability matrix (${read} of ${files.length} candidate files readable)`)
  if (!present.length) {
    out.push(`${pad("Ecosystems")}no tracked ecosystem signal found in the scanned files`)
    out.push("Exact versions, dependency names, filenames, paths, command output and environment values are never returned.")
    return out.join("\n")
  }
  out.push(`${pad("Ecosystems")}${present.map((ecosystem) => `${ecosystem}(${ecosystemFiles.get(ecosystem)})`).join("  ")}`)
  out.push(`${pad("Capability")}${present.map((ecosystem) => ecosystem.padEnd(10)).join("")}`)
  const gaps: string[] = []
  let hits = 0
  for (const capability of CAPABILITIES) {
    const row = matrix.get(capability.key)
    const cells = present.map((ecosystem) => (row?.has(ecosystem) ? "yes" : "-").padEnd(10)).join("")
    const covered = present.filter((ecosystem) => row?.has(ecosystem))
    hits += covered.length
    out.push(`${pad(capability.label)}${cells}`)
    if (covered.length === 0) gaps.push(`${capability.label}: no ecosystem shows this signal`)
    else if (covered.length < present.length) gaps.push(`${capability.label}: present for ${covered.length} of ${present.length} ecosystems`)
  }
  const applicable = CAPABILITIES.length * present.length
  out.push(`${pad("Coverage")}${((hits / applicable) * 100).toFixed(1)}% of capability and ecosystem cells are supported (${hits}/${applicable})`)
  out.push(`${pad("Gaps")}${gaps.length} of ${CAPABILITIES.length} capabilities are incomplete or absent`)
  for (const gap of gaps) out.push(`  - ${gap}`)
  out.push("Exact versions, dependency names, filenames, paths, command output and environment values are never returned.")
  return out.join("\n")
}

function majorsOf(content: string): number[] {
  const out: number[] = []
  for (const match of content.matchAll(/\b(\d{1,3})(?:\.\d{1,4}){1,3}\b/g)) {
    const value = Number(match[1])
    if (value <= 999) out.push(value)
  }
  for (const match of content.matchAll(/(?:>=|<=|>|<|\^|~)\s*(\d{1,3})(?:\.\d+)?\b/g)) {
    const value = Number(match[1])
    if (value <= 999) out.push(value)
  }
  return out
}

export async function checkToolchainDeclarations(args: { documents?: string[] }): Promise<string> {
  const documents = args.documents ?? []
  if (!documents.length) throw new Error("Provide at least one manifest or CI document in documents")
  if (documents.length > 40) throw new Error("Keep documents to 40 entries or fewer")
  const findings: string[] = []
  const managerByDocument = new Map<number, string>()
  const majorsByRuntime = new Map<string, Map<number, Set<number>>>()
  const familiesByDocument = new Map<number, Set<string>>()
  const addMajor = (runtime: string, document: number, value: number) => {
    const perDocument = majorsByRuntime.get(runtime) ?? new Map<number, Set<number>>()
    const set = perDocument.get(document) ?? new Set<number>()
    set.add(value)
    perDocument.set(document, set)
    majorsByRuntime.set(runtime, perDocument)
  }
  for (const [index, raw] of documents.entries()) {
    const document = index + 1
    const content = raw ?? ""
    if (content.length > 200000) throw new Error(`Document ${document} is longer than 200000 characters`)
    const families = new Set<string>()
    if (/"packageManager"\s*:\s*"\s*(npm|pnpm|yarn|bun)/i.test(content) || /packageManager/i.test(content)) families.add("node")
    if (/^bun\.lock|pnpm-lock|yarn\.lock|package-lock|npm-shrinkwrap/im.test(content) || /pnpm-lock\.yaml|yarn\.lock|package-lock\.json|npm-shrinkwrap\.json/.test(content)) families.add("node")
    if (/poetry\.lock|Pipfile\.lock|pyproject\.toml|requirements\.txt/.test(content)) families.add("python")
    if (/Cargo\.lock|Cargo\.toml/.test(content)) families.add("rust")
    if (/go\.sum|go\.mod/.test(content)) families.add("go")
    if (/Gemfile\.lock|Gemfile/.test(content)) families.add("ruby")
    familiesByDocument.set(document, families)
    const declared = /"packageManager"\s*:\s*"\s*(npm|pnpm|yarn|bun)/i.exec(content)
    if (declared) managerByDocument.set(document, declared[1].toLowerCase())
    for (const runtime of ["node", "python", "ruby", "java", "go", "rust", "dotnet"]) {
      const pattern = runtime === "go" ? /\b(?:go|golang|go-version)\b/i : runtime === "dotnet" ? /\b(?:dotnet|aspnet|coreclr)\b/i : new RegExp(`\\b${runtime}\\b`, "i")
      for (const line of content.split(/\r?\n/).slice(0, 4000)) {
        if (line.length > 2000 || !pattern.test(line)) continue
        for (const value of majorsOf(line)) addMajor(runtime, document, value)
      }
    }
  }
  for (const [runtime, perDocument] of majorsByRuntime) {
    const all = new Set<number>()
    for (const set of perDocument.values()) for (const value of set) all.add(value)
    if (all.size <= 1) continue
    const documents = [...perDocument.keys()]
    const local = [...perDocument.entries()].filter(([, set]) => set.size > 1)
    findings.push(local.length
      ? `${runtime}: ${local.length} document${local.length === 1 ? "" : "s"} name more than one major internally (${all.size} distinct majors in total)`
      : `${runtime}: ${documents.length} documents disagree on the major (${all.size} distinct majors across them)`)
  }
  for (const [document, families] of familiesByDocument) {
    const manager = managerByDocument.get(document)
    if (manager && !families.has("node")) findings.push(`document ${document}: declares a package manager but carries no node lockfile signal`)
    if (!manager && families.has("node") && document === 1) findings.push(`document ${document}: carries node lockfile signals but declares no packageManager field`)
  }
  const out: string[] = []
  out.push(`Toolchain declaration check over ${documents.length} supplied document${documents.length === 1 ? "" : "s"} (text never echoed)`)
  out.push(`${pad("Runtimes seen")}${[...majorsByRuntime.keys()].sort().join("  ") || "none"}`)
  out.push(`${pad("Contradictions")}${findings.length}`)
  for (const finding of findings.slice(0, 20)) out.push(`  - ${finding}`)
  if (findings.length > 20) out.push(`  +${findings.length - 20} further findings not listed`)
  out.push(`${pad("Verdict")}${findings.length ? "declarations disagree and need reconciling before builds can be called reproducible" : "no contradiction between the supplied declarations was detected"}`)
  out.push("Document text, exact versions, dependency names, paths and environment values are never returned.")
  return out.join("\n")
}
