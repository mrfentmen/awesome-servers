/**
 * JSON with Comments — keyless public API client.
 */

export class SourceError extends Error {}

type Strip = { text: string; error?: string; errorLine?: number }

function strip(source: string, trailingCommas: boolean): Strip {
  let out = ""
  let i = 0
  let inString = false
  let quote = ""
  while (i < source.length) {
    const ch = source[i]
    const next = source[i + 1]
    if (inString) {
      out += ch
      if (ch === "\\") {
        if (next !== undefined) {
          out += next
          i += 2
          continue
        }
      } else if (ch === quote) {
        inString = false
      }
      i++
      continue
    }
    if (ch === '"' || ch === "'") {
      inString = true
      quote = ch
      out += ch
      i++
      continue
    }
    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i++
      continue
    }
    if (ch === "/" && next === "*") {
      i += 2
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i++
      i += 2
      continue
    }
    out += ch
    i++
  }
  if (inString) return { text: out, error: "the document ends inside a string literal" }
  if (trailingCommas) {
    const cleaned = out.replace(/,(\s*[}\]])/g, "$1")
    return { text: cleaned }
  }
  return { text: out }
}

function location(text: string, position: number): { line: number; column: number; lineText: string } {
  const upTo = text.slice(0, Math.max(0, Math.min(position, text.length)))
  const lines = upTo.split("\n")
  const line = lines.length
  const column = lines[lines.length - 1].length + 1
  const fullLine = text.split("\n")[line - 1] ?? ""
  return { line, column, lineText: fullLine }
}

/**
 * Newer Node builds report JSON syntax errors without a position, so find the
 * first offending character ourselves. Only called after JSON.parse failed.
 * Returns the character index of the error, or null if the scan got through
 * (in which case the caller falls back to Node's own message).
 */
function scanError(text: string): number | null {
  let i = 0
  const ws = () => {
    while (i < text.length && (text[i] === " " || text[i] === "\t" || text[i] === "\n" || text[i] === "\r")) i++
  }
  function literal(word: string): number | null {
    if (text.startsWith(word, i)) {
      i += word.length
      return null
    }
    return i
  }
  function number(): number | null {
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i))
    if (!m || !m[0]) return i
    i += m[0].length
    return null
  }
  function string(): number | null {
    const start = i
    i++
    while (i < text.length) {
      const ch = text[i]
      if (ch === "\\") {
        i += 2
        continue
      }
      if (ch === '"') {
        i++
        return null
      }
      if (ch === "\n") return start
      i++
    }
    return start
  }
  function value(): number | null {
    ws()
    if (i >= text.length) return i
    const ch = text[i]
    if (ch === "{") return object()
    if (ch === "[") return array()
    if (ch === '"') return string()
    if (ch === "t") return literal("true")
    if (ch === "f") return literal("false")
    if (ch === "n") return literal("null")
    if (ch === "-" || (ch >= "0" && ch <= "9")) return number()
    return i
  }
  function object(): number | null {
    i++
    ws()
    if (text[i] === "}") {
      i++
      return null
    }
    for (;;) {
      ws()
      if (text[i] !== '"') return i
      const keyErr = string()
      if (keyErr !== null) return keyErr
      ws()
      if (text[i] !== ":") return i
      i++
      const valErr = value()
      if (valErr !== null) return valErr
      ws()
      if (text[i] === ",") {
        i++
        continue
      }
      if (text[i] === "}") {
        i++
        return null
      }
      return i
    }
  }
  function array(): number | null {
    i++
    ws()
    if (text[i] === "]") {
      i++
      return null
    }
    for (;;) {
      const valErr = value()
      if (valErr !== null) return valErr
      ws()
      if (text[i] === ",") {
        i++
        continue
      }
      if (text[i] === "]") {
        i++
        return null
      }
      return i
    }
  }
  const err = value()
  if (err !== null) return err
  ws()
  return i >= text.length ? null : i
}

function parseOrThrow(stripped: string): any {
  try {
    return JSON.parse(stripped)
  } catch (e) {
    const message = (e as Error).message
    const m = message.match(/position (\d+)/)
    const at = m ? Number(m[1]) : scanError(stripped)
    if (at !== null) {
      const { line, column, lineText } = location(stripped, at)
      throw new SourceError(`invalid JSON after stripping comments - line ${line}, column ${column}: ${message}\n   ${lineText.slice(0, 120)}\n   ${" ".repeat(Math.max(0, column - 1))}^`)
    }
    throw new SourceError(`invalid JSON after stripping comments: ${message}`)
  }
}

function summarize(value: any): string {
  if (Array.isArray(value)) {
    const keys = value.length && typeof value[0] === "object" && value[0] !== null ? Object.keys(value[0]).slice(0, 8) : []
    return `array with ${value.length} item(s)${keys.length ? ` · first item keys: ${keys.join(", ")}` : ""}`
  }
  if (value !== null && typeof value === "object") {
    return `object with ${Object.keys(value).length} key(s): ${Object.keys(value).slice(0, 12).join(", ")}`
  }
  return `${typeof value} value: ${JSON.stringify(value).slice(0, 80)}`
}

export async function parseJsonc(a: { text: string; trailingCommas?: boolean }): Promise<string> {
  const trailing = a.trailingCommas !== false
  const res = strip(a.text, trailing)
  if (res.error) throw new SourceError(res.error)
  const value = parseOrThrow(res.text)
  return [
    `Parsed: ${summarize(value)}`,
    "",
    JSON.stringify(value, null, 2).slice(0, 4000),
    JSON.stringify(value, null, 2).length > 4000 ? "\n(output truncated at 4000 characters)" : "",
  ].filter(Boolean).join("\n")
}

export async function stripJsonc(a: { text: string; trailingCommas?: boolean }): Promise<string> {
  const trailing = a.trailingCommas !== false
  const res = strip(a.text, trailing)
  if (res.error) throw new SourceError(res.error)
  const removed = a.text.length - res.text.length
  return [
    `Cleaned JSON (${removed} character(s) of comments or trailing commas removed):`,
    "",
    res.text.trim(),
  ].join("\n")
}

export async function validateJsonc(a: { text: string }): Promise<string> {
  const res = strip(a.text, true)
  if (res.error) return `Invalid: ${res.error}`
  try {
    const value = JSON.parse(res.text)
    return `Valid JSONC. ${summarize(value)}`
  } catch (e) {
    const message = (e as Error).message
    const m = message.match(/position (\d+)/)
    const at = m ? Number(m[1]) : scanError(res.text)
    if (at !== null) {
      const { line, column, lineText } = location(res.text, at)
      return [
        `Invalid JSONC: ${message}`,
        "",
        `line ${line}, column ${column}:`,
        `   ${lineText.slice(0, 120)}`,
        `   ${" ".repeat(Math.max(0, column - 1))}^`,
        "",
        "Note: positions refer to the text after comments were stripped.",
      ].join("\n")
    }
    return `Invalid JSONC: ${message}`
  }
}
