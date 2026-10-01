export class RegexError extends Error {}

function compile(pattern: string, flags = "g"): RegExp {
  try {
    return new RegExp(pattern, flags)
  } catch (e) {
    throw new RegexError(`Invalid regex: ${e instanceof Error ? e.message : String(e)}`)
  }
}

export async function testRegex(args: { pattern?: string; input?: string }): Promise<string> {
  const pattern = args.pattern ?? ""
  const input = args.input ?? ""
  if (!pattern) throw new RegexError("Provide a pattern")
  const re = compile(pattern, "g")
  const matches = [...input.matchAll(re)].slice(0, 20)
  return `Pattern: /${pattern}/g\nInput length: ${input.length}\nMatched: ${matches.length > 0 ? "yes" : "no"}\nMatch count (capped 20): ${matches.length}${matches[0] ? `\nFirst match: "${matches[0][0]}" at index ${matches[0].index}` : ""}`
}

export async function matches(args: { pattern?: string; input?: string; limit?: number }): Promise<string> {
  const pattern = args.pattern ?? ""
  const input = args.input ?? ""
  if (!pattern) throw new RegexError("Provide a pattern")
  const limit = Math.min(args.limit ?? 15, 50)
  const re = compile(pattern, "g")
  const all = [...input.matchAll(re)].slice(0, limit)
  if (all.length === 0) return "No matches"
  return all.map((m, i) => {
    const groups = m.slice(1).length ? ` groups=[${m.slice(1).join(", ")}]` : ""
    return `${i + 1}. "${m[0]}" at ${m.index}${groups}`
  }).join("\n")
}

// ---- muxC tools:

