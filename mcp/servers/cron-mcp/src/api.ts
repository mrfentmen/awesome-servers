import parser from "cron-parser"
const parseExpression = parser.parseExpression.bind(parser)
type CronExpression = parser.CronExpression

export class CronError extends Error {}

function parts(expression: string): string[] {
  const p = expression.trim().split(/\s+/)
  if (p.length !== 5) throw new CronError("Provide a 5 field cron expression like */5 * * * *")
  return p
}

function describeField(field: string, what: string, max: number, named: Record<string, string>): string {
  if (field === "*") return `every ${what}`
  if (field.startsWith("*/")) return `every ${field.slice(2)} ${what}s`
  if (field.includes("/")) {
    const [base, step] = field.split("/")
    const b = base === "*" ? "" : ` from ${base}`
    return `every ${step} ${what}s${b}`
  }
  if (field.includes("-")) {
    const [a, b] = field.split("-")
    return `${what}s ${a} through ${b}`
  }
  if (field.includes(",")) {
    const vals = field.split(",").map((v) => named[v] ?? v)
    return `${what}s ${vals.join(", ")}`
  }
  return `${what} ${named[field] ?? field}`
}

const DAYS: Record<string, string> = { "0": "Sunday", "1": "Monday", "2": "Tuesday", "3": "Wednesday", "4": "Thursday", "5": "Friday", "6": "Saturday", "7": "Sunday" }
const MONTHS: Record<string, string> = { "1": "January", "2": "February", "3": "March", "4": "April", "5": "May", "6": "June", "7": "July", "8": "August", "9": "September", "10": "October", "11": "November", "12": "December" }

export async function describe(args: { expression?: string }): Promise<string> {
  const expr = (args.expression ?? "").trim()
  if (!expr) throw new CronError("Provide a cron expression")
  const [min, hour, dom, mon, dow] = parts(expr)
  try {
    parseExpression(expr)
  } catch {
    throw new CronError("That cron expression is not valid")
  }
  const bits = [
    describeField(min, "minute", 59, {}),
    describeField(hour, "hour", 23, {}),
    describeField(dom, "day of month", 31, {}),
    describeField(mon, "month", 12, MONTHS),
    describeField(dow, "day of week", 7, DAYS),
  ]
  return `Cron \"${expr}\" runs:\n  ${bits.join(",\n  ")}`
}

export async function next(args: { expression?: string; count?: number }): Promise<string> {
  const expr = (args.expression ?? "").trim()
  if (!expr) throw new CronError("Provide a cron expression")
  const count = Math.min(args.count ?? 5, 20)
  let cron: CronExpression
  try {
    cron = parseExpression(expr)
  } catch {
    throw new CronError("That cron expression is not valid")
  }
  const rows: string[] = []
  for (let i = 0; i < count; i++) {
    const d = cron.next()
    rows.push(`${i + 1}. ${d.toISOString().replace("T", " ").slice(0, 16)}`)
  }
  return `Next ${count} runs of \"${expr}\":\n` + rows.join("\n")
}

// ---- muxC tools:

/** The N runs that already happened before a reference instant. */
export async function previousRuns(args: { expression?: string; before?: string; count?: number }): Promise<string> {
  const expr = (args.expression ?? "").trim()
  if (!expr) throw new CronError("Provide a cron expression")
  const count = Math.min(Math.max(args.count ?? 5, 1), 20)
  const ref = (args.before ?? "").trim()
  let cron: CronExpression
  try {
    cron = ref ? parseExpression(expr, { currentDate: new Date(ref) }) : parseExpression(expr)
  } catch (e) {
    if (ref && /Invalid|invalid date/i.test(e instanceof Error ? e.message : String(e))) {
      throw new CronError(`"${ref}" is not a date I can read; use YYYY-MM-DD or a full ISO timestamp`)
    }
    throw new CronError("That cron expression is not valid")
  }
  const rows: string[] = []
  for (let i = 0; i < count; i++) {
    const d = cron.prev()
    rows.push(`${i + 1}. ${d.toISOString().replace("T", " ").slice(0, 16)}`)
  }
  const when = ref ? ` before ${ref}` : ""
  return `Previous ${count} runs of "${expr}"${when}:\n` + rows.join("\n")
}

/** Whether an expression parses, and if it does, when it next fires. */
export async function validate(args: { expression?: string }): Promise<string> {
  const expr = (args.expression ?? "").trim()
  if (!expr) throw new CronError("Provide a cron expression to check")
  let cron: CronExpression
  const started = new Date().toISOString()
  try {
    cron = parseExpression(expr)
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    const field = expr.trim().split(/\s+/)
    return [
      `"${expr}" is NOT a valid cron expression.`,
      `reason: ${detail}`,
      `fields found: ${field.length}${field.length === 5 ? " (correct)" : field.length < 5 ? " (too few, a 5 field expression needs minute hour day-of-month month day-of-week)" : " (too many)"}`,
    ].join("\n")
  }
  const upcoming: string[] = []
  for (let i = 0; i < 3; i++) upcoming.push(cron.next().toISOString().replace("T", " ").slice(0, 16))
  return [`"${expr}" is a valid cron expression.`, `next three runs: ${upcoming.join(", ")}`, `checked at ${started.slice(0, 19).replace("T", " ")} UTC`].join("\n")
}
