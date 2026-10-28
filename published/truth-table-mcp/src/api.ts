/**
 * Truth Table — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "Truth Table"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "truth-table-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

type Token = { kind: "var"; value: string } | { kind: "op"; value: string } | { kind: "const"; value: boolean }

function tokenize(expr: string): Token[] {
  const out: Token[] = []
  let i = 0
  while (i < expr.length) {
    const ch = expr[i]
    if (/\s/.test(ch)) { i++; continue }
    if (expr.startsWith("<->", i)) { out.push({ kind: "op", value: "iff" }); i += 3; continue }
    if (expr.startsWith("->", i)) { out.push({ kind: "op", value: "imp" }); i += 2; continue }
    if (expr.startsWith("&&", i)) { out.push({ kind: "op", value: "and" }); i += 2; continue }
    if (expr.startsWith("||", i)) { out.push({ kind: "op", value: "or" }); i += 2; continue }
    if (ch === "&") { out.push({ kind: "op", value: "and" }); i++; continue }
    if (ch === "|") { out.push({ kind: "op", value: "or" }); i++; continue }
    if (ch === "!" || ch === "~") { out.push({ kind: "op", value: "not" }); i++; continue }
    if (ch === "(" || ch === ")") { out.push({ kind: "op", value: ch }); i++; continue }
    const word = expr.slice(i).match(/^(xor|and|or|not|true|false|[A-Za-z_][A-Za-z0-9_]*)/i)
    if (!word) throw new SourceError(`unexpected character "${ch}" at position ${i + 1}`)
    const w = word[0].toLowerCase()
    if (w === "true" || w === "false") out.push({ kind: "const", value: w === "true" })
    else if (["xor", "and", "or", "not"].includes(w)) out.push({ kind: "op", value: w })
    else out.push({ kind: "var", value: word[0] })
    i += word[0].length
  }
  return out
}

class Parser {
  private pos = 0
  constructor(private tokens: Token[]) {}
  peek(): Token | undefined { return this.tokens[this.pos] }
  take(): Token { const t = this.tokens[this.pos++]; if (!t) throw new SourceError("unexpected end of expression"); return t }
  parse(): (env: Record<string, boolean>) => boolean {
    const fn = this.iff()
    if (this.pos < this.tokens.length) throw new SourceError("unexpected trailing tokens in expression")
    return fn
  }
  iff(): (env: Record<string, boolean>) => boolean {
    let left = this.imp()
    while (this.peek()?.kind === "op" && (this.peek() as { value: string }).value === "iff") {
      this.take()
      const right = this.imp()
      const l = left
      left = (e) => l(e) === right(e)
    }
    return left
  }
  imp(): (env: Record<string, boolean>) => boolean {
    const left = this.or()
    const t = this.peek()
    if (t?.kind === "op" && t.value === "imp") {
      this.take()
      const right = this.imp()
      return (e) => !left(e) || right(e)
    }
    return left
  }
  or(): (env: Record<string, boolean>) => boolean {
    let left = this.and()
    while (this.peek()?.kind === "op" && ["or", "xor"].includes((this.peek() as { value: string }).value)) {
      const op = (this.take() as { value: string }).value
      const right = this.and()
      const l = left
      left = op === "xor" ? (e) => l(e) !== right(e) : (e) => l(e) || right(e)
    }
    return left
  }
  and(): (env: Record<string, boolean>) => boolean {
    let left = this.unary()
    while (this.peek()?.kind === "op" && (this.peek() as { value: string }).value === "and") {
      this.take()
      const right = this.unary()
      const l = left
      left = (e) => l(e) && right(e)
    }
    return left
  }
  unary(): (env: Record<string, boolean>) => boolean {
    const t = this.take()
    if (t.kind === "op" && t.value === "not") {
      const inner = this.unary()
      return (e) => !inner(e)
    }
    if (t.kind === "const") return () => t.value
    if (t.kind === "var") return (e) => {
      if (!(t.value in e)) throw new SourceError(`variable "${t.value}" has no value`)
      return e[t.value]
    }
    if (t.kind === "op" && t.value === "(") {
      const inner = this.iff()
      const close = this.take()
      if (close.kind !== "op" || close.value !== ")") throw new SourceError("missing closing parenthesis")
      return inner
    }
    throw new SourceError("invalid expression")
  }
}

function compile(expr: string): { fn: (env: Record<string, boolean>) => boolean; vars: string[] } {
  const tokens = tokenize(expr)
  if (tokens.length === 0) throw new SourceError("expression is empty")
  const vars = [...new Set(tokens.filter((t): t is { kind: "var"; value: string } => t.kind === "var").map((t) => t.value))].sort()
  if (vars.length > 8) throw new SourceError("at most 8 variables are supported")
  return { fn: new Parser(tokens).parse(), vars }
}

export async function evaluateExpression(a: { expression: string; variables: Record<string, boolean> }): Promise<string> {
  const { fn } = compile(a.expression)
  const value = fn(a.variables)
  return [
    `Expression: ${a.expression}`,
    `Variables: ${Object.entries(a.variables).map(([k, v]) => `${k}=${v}`).join(", ") || "none"}`,
    `Result: ${value ? "true" : "false"}`,
  ].join("\n")
}

function table(expr: string): { vars: string[]; rows: { env: Record<string, boolean>; value: boolean }[] } {
  const { fn, vars } = compile(expr)
  const rows: { env: Record<string, boolean>; value: boolean }[] = []
  const total = 2 ** vars.length
  for (let i = 0; i < total; i++) {
    const env: Record<string, boolean> = {}
    vars.forEach((v, bit) => { env[v] = Boolean((i >>> (vars.length - 1 - bit)) & 1) })
    rows.push({ env, value: fn(env) })
  }
  return { vars, rows }
}

export async function truthTable(a: { expression: string }): Promise<string> {
  const { vars, rows } = table(a.expression)
  const head = [...vars.map((v) => v.padEnd(6)), "result"].join(" ")
  const body = rows.map((r) => [...vars.map((v) => (r.env[v] ? "T" : "F").padEnd(6)), r.value ? "T" : "F"].join(" "))
  return [`Expression: ${a.expression}`, `Variables: ${vars.join(", ") || "none"}`, "", head, ...body].join("\n")
}

export async function checkTautology(a: { expression: string }): Promise<string> {
  const { rows } = table(a.expression)
  const trues = rows.filter((r) => r.value).length
  const kind = trues === rows.length ? "tautology (always true)" : trues === 0 ? "contradiction (always false)" : "contingent"
  return [`Expression: ${a.expression}`, `Classification: ${kind}`, `True in ${trues} of ${rows.length} assignments.`].join("\n")
}
