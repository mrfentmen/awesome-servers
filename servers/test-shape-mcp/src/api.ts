

// ---- muxB tools:
const MAX_SOURCE = 400000
const MAX_LINES = 40000

function pad(label: string, width = 22): string {
  return label.length >= width ? label : label + " ".repeat(width - label.length)
}

function nonEmpty(source: string): string[] {
  return source.split(/\r?\n/).filter((line) => line.trim().length > 0)
}

function count(source: string, pattern: RegExp): number {
  return (source.match(pattern) ?? []).length
}

export async function analyzeTestSource(args: { source?: string }): Promise<string> {
  const source = args.source ?? ""
  if (!source.trim()) throw new Error("Provide test source text in source to analyse")
  if (source.length > MAX_SOURCE) throw new Error(`Keep source under ${MAX_SOURCE} characters`)
  const lines = nonEmpty(source).slice(0, MAX_LINES)
  const describes = count(source, /\bdescribe\s*\(/g)
  const tests = count(source, /\b(?:it|test)(?:\s*\.\s*(?:only|skip|todo|each|failing))?\s*\(/g)
  const asserts = count(source, /\bexpect\s*\(|\bassert(?:\.\w+)?\s*\(/g)
  const skipped = count(source, /\b(?:it|test|describe)\s*\.\s*(?:skip|x?it|only)\b|\bxit\s*\(|\bxdescribe\s*\(/g)
  const focused = count(source, /\b(?:it|test|describe)\s*\.\s*only\b/g)
  const todo = count(source, /\b(?:it|test|describe)\s*\.\s*todo\b|\bxit\s*\(|\bxdescribe\s*\(/g)
  const tableDriven = count(source, /\b(?:it|test|describe)\s*\.\s*each\b/g)
  const hasAssertions = count(source, /expect\s*\.\s*hasAssertions\s*\(/g)
  const snapshots = count(source, /toMatchSnapshot\s*\(|toMatchInlineSnapshot\s*\(|snapshot:/g)
  const sleeps = count(source, /await\s+new\s+Promise\s*\([^)]*setTimeout|await\s+sleep\s*\(|waitForTimeout\s*\(|setTimeout\s*\(\s*resolve/g)
  const consoleCalls = count(source, /\bconsole\s*\.\s*(?:log|debug|info|warn|error|dir)\s*\(/g)
  const asyncTests = count(source, /\b(?:it|test)(?:\s*\.\s*\w+)?\s*\([^\n]*\basync\b/g)
  const emptyTests = count(source, /\b(?:it|test)\s*\([^)]*,\s*(?:async\s*\([^)]*\)|\(\s*\)|function\s*\([^)]*\))\s*=>\s*\{\s*\}\s*\)/g)
  const tryBlocks = count(source, /\btry\s*\{/g)
  const catchBlocks = count(source, /\bcatch\s*(?:\([^)]*\))?\s*\{\s*\}/g)
  let maxDepth = 0
  let depth = 0
  for (const line of source.split(/\r?\n/)) {
    if (/\bdescribe\s*\(/.test(line)) { depth += 1; maxDepth = Math.max(maxDepth, depth) }
    else if (depth > 0 && line.includes("})")) depth = Math.max(0, depth - 1)
  }
  const testsPerDescribe = describes ? tests / describes : tests
  const assertsPerTest = tests ? asserts / tests : 0
  const scoreParts: string[] = []
  let score = 50
  if (assertsPerTest >= 1) { score += 15; scoreParts.push("+15 assertions per test at or above 1") }
  if (emptyTests === 0) { score += 10; scoreParts.push("+10 no empty test bodies") }
  if (focused === 0) { score += 10; scoreParts.push("+10 no focused .only left in the source") }
  if (sleeps === 0) { score += 10; scoreParts.push("+10 no hardcoded sleeps") }
  if (maxDepth <= 3) { score += 10; scoreParts.push("+10 describe nesting at or below 3") }
  if (hasAssertions > 0) { score += 5; scoreParts.push("+5 expect.hasAssertions present") }
  if (consoleCalls > 0) { score -= 10; scoreParts.push("-10 console output inside test code") }
  if (skipped - todo > 0) { score -= 5; scoreParts.push("-5 skipped tests that are not marked todo") }
  const bounded = Math.max(0, Math.min(100, score))
  const out: string[] = []
  out.push(`Test source analysis (${lines.length} non-empty lines; no test name, path or source line is returned)`)
  if (!tests && !describes) {
    out.push(`${pad("Result")}no describe, it or test call was found in the supplied source`)
    out.push("Test names, paths, source text and assertion details are never emitted.")
    return out.join("\n")
  }
  out.push(`${pad("Structure")}${describes} describe blocks, ${tests} it/test blocks, ${testsPerDescribe.toFixed(1)} tests per describe, max describe nesting ${maxDepth}`)
  out.push(`${pad("Assertions")}${asserts} assertion calls, ${assertsPerTest.toFixed(2)} per test, expect.hasAssertions in ${hasAssertions} place(s)`)
  out.push(`${pad("Selection")}${skipped} skipped or todo, ${focused} focused .only, ${tableDriven} table-driven each blocks, ${snapshots} snapshot references, ${asyncTests} async tests`)
  out.push(`${pad("Risk signals")}${emptyTests} empty test bodies, ${sleeps} hardcoded sleeps, ${tryBlocks} try blocks, ${catchBlocks} empty catch blocks, ${consoleCalls} console calls`)
  out.push(`${pad("Quality score")}${bounded}/100`)
  for (const part of scoreParts) out.push(`  ${part}`)
  out.push(`${pad("Reading")}${bounded >= 80 ? "the source is well formed and asserts on nearly every test" : bounded >= 60 ? "the source is usable but has one or more fixable smells" : "the source needs attention before it can carry weight as a test suite"}`)
  out.push("Test names, paths, source text and assertion details are never emitted.")
  return out.join("\n")
}

export async function checkTestConventions(args: { source?: string }): Promise<string> {
  const source = args.source ?? ""
  if (!source.trim()) throw new Error("Provide test source text in source to check")
  if (source.length > MAX_SOURCE) throw new Error(`Keep source under ${MAX_SOURCE} characters`)
  const raw = source.split("\n")
  const all = raw.filter((line) => line.trim().length > 0)
  const rules: Array<{ name: string; ok: boolean; detail: string }> = []
  const crlf = (source.match(/\r\n/g) ?? []).length
  rules.push({ name: "line endings", ok: crlf === 0, detail: crlf === 0 ? `LF only across ${raw.length} lines` : `${crlf} CRLF line endings mixed in` })
  const tabs = count(source, /^\t+/gm)
  const spaceLines = count(source, /^ +/gm)
  rules.push({ name: "indentation", ok: tabs === 0 || spaceLines === 0, detail: `dominant style is ${tabs >= spaceLines ? "tabs" : "spaces"} (${tabs} tab-indented, ${spaceLines} space-indented lines)` })
  const widths = new Map<number, number>()
  for (const line of raw) {
    const match = /^( +)\S/.exec(line)
    if (!match) continue
    widths.set(match[1].length, (widths.get(match[1].length) ?? 0) + 1)
  }
  const topWidth = [...widths.entries()].sort((a, b) => b[1] - a[1])[0]
  rules.push({ name: "indent width", ok: Boolean(topWidth), detail: topWidth ? `most common indent width is ${topWidth[0]} spaces on ${topWidth[1]} lines` : "no space indentation found to measure" })
  const statementish = all.filter((line) => /[;{]$/.test(line.trim())).length
  const semicolons = all.filter((line) => /;\s*$/.test(line)).length
  rules.push({ name: "terminators", ok: statementish === 0 || semicolons / statementish >= 0.8, detail: `${semicolons} of ${statementish} block- or statement-ending lines end in a semicolon` })
  const singleQuotes = (source.match(/'[^'\n]*'/g) ?? []).length
  const doubleQuotes = (source.match(/"[^"\n]*"/g) ?? []).length
  rules.push({ name: "quote style", ok: singleQuotes + doubleQuotes > 0, detail: singleQuotes + doubleQuotes > 0 ? `${singleQuotes >= doubleQuotes ? "single" : "double"} quotes dominate (${singleQuotes} single, ${doubleQuotes} double)` : "no string literals found to compare" })
  const itCalls = count(source, /\bit\s*\(/g)
  const testCalls = count(source, /\btest\s*\(/g)
  rules.push({ name: "test call style", ok: itCalls + testCalls > 0, detail: itCalls + testCalls > 0 ? `${itCalls >= testCalls ? "it" : "test"}() dominates (${itCalls} it, ${testCalls} test)` : "no it() or test() calls found" })
  const arrow = count(source, /\b(?:it|test|describe)\s*\([^)]*=>\s*\{/g)
  const functionKeyword = count(source, /\b(?:it|test|describe)\s*\([^)]*function\s*\(/g)
  rules.push({ name: "callback style", ok: arrow + functionKeyword > 0, detail: arrow + functionKeyword > 0 ? `${arrow >= functionKeyword ? "arrow" : "function"} callbacks dominate (${arrow} arrow, ${functionKeyword} function)` : "no callback style found" })
  const trailing = all.filter((line) => /\s$/.test(line)).length
  rules.push({ name: "trailing whitespace", ok: trailing === 0, detail: trailing === 0 ? "no trailing whitespace on non-empty lines" : `${trailing} non-empty lines end in whitespace` })
  const doubleBlank = (source.match(/\n[ \t]*\n[ \t]*\n/g) ?? []).length
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
