

// ---- muxB tools:
const MAX_SOURCE = 400000

function pad(label: string, width = 22): string {
  return label.length >= width ? label : label + " ".repeat(width - label.length)
}

function count(source: string, pattern: RegExp): number {
  return (source.match(pattern) ?? []).length
}

export async function checkTestConventions(args: { source?: string }): Promise<string> {
  const source = args.source ?? ""
  if (!source.trim()) throw new Error("Provide test source text in source to check")
  if (source.length > MAX_SOURCE) throw new Error(`Keep source under ${MAX_SOURCE} characters`)
  const raw = source.split("\n")
  const all = raw.filter((line) => line.trim().length > 0)
  const rules: Array<{ name: string; ok: boolean; detail: string }> = []
  const crlf = (source.match(new RegExp("\\r\\n", "g")) ?? []).length
  rules.push({ name: "line endings", ok: crlf === 0, detail: crlf === 0 ? `LF only across ${raw.length} lines` : `${crlf} CRLF line endings mixed in` })
  const tabs = count(source, new RegExp("^\\t+", "gm"))
  const spaceLines = count(source, new RegExp("^ +", "gm"))
  rules.push({ name: "indentation", ok: tabs === 0 || spaceLines === 0, detail: `dominant style is ${tabs >= spaceLines ? "tabs" : "spaces"} (${tabs} tab-indented, ${spaceLines} space-indented lines)` })
  const widths = new Map<number, number>()
  for (const line of raw) {
    const match = new RegExp("^( +)\\S", "").exec(line)
    if (!match) continue
    widths.set(match[1].length, (widths.get(match[1].length) ?? 0) + 1)
  }
  const topWidth = [...widths.entries()].sort((a, b) => b[1] - a[1])[0]
  rules.push({ name: "indent width", ok: Boolean(topWidth), detail: topWidth ? `most common indent width is ${topWidth[0]} spaces on ${topWidth[1]} lines` : "no space indentation found to measure" })
  const statementish = all.filter((line) => new RegExp("[;{]$", "").test(line.trim())).length
  const semicolons = all.filter((line) => new RegExp(";\\s*$", "").test(line)).length
  rules.push({ name: "terminators", ok: statementish === 0 || semicolons / statementish >= 0.8, detail: `${semicolons} of ${statementish} block- or statement-ending lines end in a semicolon` })
  const singleQuotes = (source.match(new RegExp("'[^'\\n]*'", "g")) ?? []).length
  const doubleQuotes = (source.match(new RegExp("\"[^\"\\n]*\"", "g")) ?? []).length
  rules.push({ name: "quote style", ok: singleQuotes + doubleQuotes > 0, detail: singleQuotes + doubleQuotes > 0 ? `${singleQuotes >= doubleQuotes ? "single" : "double"} quotes dominate (${singleQuotes} single, ${doubleQuotes} double)` : "no string literals found to compare" })
  const itCalls = count(source, new RegExp("\\bit\\s*\\(", "g"))
  const testCalls = count(source, new RegExp("\\btest\\s*\\(", "g"))
  rules.push({ name: "test call style", ok: itCalls + testCalls > 0, detail: itCalls + testCalls > 0 ? `${itCalls >= testCalls ? "it" : "test"}() dominates (${itCalls} it, ${testCalls} test)` : "no it() or test() calls found" })
  const arrow = count(source, new RegExp("\\b(?:it|test|describe)\\s*\\([^)]*=>\\s*\\{", "g"))
  const functionKeyword = count(source, new RegExp("\\b(?:it|test|describe)\\s*\\([^)]*function\\s*\\(", "g"))
  rules.push({ name: "callback style", ok: arrow + functionKeyword > 0, detail: arrow + functionKeyword > 0 ? `${arrow >= functionKeyword ? "arrow" : "function"} callbacks dominate (${arrow} arrow, ${functionKeyword} function)` : "no callback style found" })
  const trailing = all.filter((line) => new RegExp("\\s$", "").test(line)).length
  rules.push({ name: "trailing whitespace", ok: trailing === 0, detail: trailing === 0 ? "no trailing whitespace on non-empty lines" : `${trailing} non-empty lines end in whitespace` })
  const doubleBlank = (source.match(new RegExp("\\n[ \\t]*\\n[ \\t]*\\n", "g")) ?? []).length
  rules.push({ name: "blank lines", ok: doubleBlank === 0, detail: doubleBlank === 0 ? "no runs of two or more blank lines" : `${doubleBlank} run(s) of two or more blank lines` })
  const long = all.filter((line) => line.length > 140).length
  rules.push({ name: "line length", ok: long === 0, detail: long === 0 ? `every line is 140 characters or shorter (longest ${all.reduce((max, line) => Math.max(max, line.length), 0)})` : `${long} lines exceed 140 characters` })
  rules.push({ name: "final newline", ok: source.endsWith("\n"), detail: source.endsWith("\n") ? "source ends with a newline" : "source does not end with a newline" })
  const problems = rules.filter((rule) => !rule.ok)
  const out: string[] = []
  out.push(`Test convention check (${all.length} non-empty lines, ${raw.length} total)`)
  out.push(`${pad("Rules")}pass ${rules.length - problems.length} of ${rules.length}`)
  for (const rule of rules) out.push(`  ${rule.ok ? "ok  " : "FAIL"} ${rule.name.padEnd(18)} ${rule.detail}`)
  out.push(`${pad("Verdict")}${problems.length ? `${problems.length} convention${problems.length === 1 ? "" : "s"} worth normalising before review` : "the source already follows every convention this check looks at"}`)
  out.push("Test names, paths, source lines and string contents are never returned; only counts and style verdicts are.")
  return out.join("\n")
}

// ---- gap4a3 tools:

export interface PublicCiArgs {
  owner: string;
  repo: string;
  limit?: number;
  ref?: string;
}

function ciRepoPath(args: PublicCiArgs): string {
  if (!args.owner.trim() || !args.repo.trim()) throw new Error("Provide owner and repo.")
  return `/repos/${encodeURIComponent(args.owner.trim())}/${encodeURIComponent(args.repo.trim())}`
}

function ciLimit(value?: number): number {
  return Math.max(1, Math.min(Math.round(value ?? 10), 30))
}

async function ciJson<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { "User-Agent": "mrfentmen-test-shape-mcp/1.0", Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!response.ok) throw new Error(`GitHub returned ${response.status}; only public repositories are supported.`)
  return await response.json() as T
}

export async function ciWorkflows(args: PublicCiArgs): Promise<string> {
  const limit = ciLimit(args.limit)
  const data = await ciJson<{ total_count?: number; workflows?: Array<{ name?: string; state?: string; path?: string }> }>(`${ciRepoPath(args)}/actions/workflows?per_page=${limit}`)
  const rows = (data.workflows ?? []).slice(0, limit)
  return `Public CI workflow inventory (${data.total_count ?? "not reported"} total; showing ${rows.length}):\n` +
    (rows.length ? rows.map((r, i) => `${i + 1}. ${(r.name ?? "not reported").slice(0, 120)} | ${r.state ?? "not reported"} | ${(r.path ?? "not reported").slice(0, 200)}`).join("\n") : "No workflows reported.")
}

