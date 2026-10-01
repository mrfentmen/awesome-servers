const UA = "mrfentmen-time-tools-mcp/1.0"
export class TimeError extends Error {}

export async function now(args: Record<string, never>): Promise<string> {
  const d = new Date()
  return `Unix seconds: ${Math.floor(d.getTime() / 1000)}\nISO: ${d.toISOString()}\nLocal: ${d.toString()}\nUTC date: ${d.toISOString().slice(0, 10)}`
}

export async function fromTimestamp(args: { timestamp?: number }): Promise<string> {
  const ts = args.timestamp
  if (ts === undefined || !Number.isFinite(ts)) throw new TimeError("Provide a unix timestamp in seconds")
  const d = new Date(ts * 1000)
  if (Number.isNaN(d.getTime())) throw new TimeError("Invalid timestamp")
  return `${ts} seconds ->\nISO: ${d.toISOString()}\nLocal: ${d.toString()}`
}

export async function dateDiff(args: { start?: string; end?: string }): Promise<string> {
  const start = (args.start ?? "").trim()
  const end = (args.end ?? "").trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    throw new TimeError("Provide dates as YYYY-MM-DD")
  }
  const a = new Date(start + "T00:00:00Z")
  const b = new Date(end + "T00:00:00Z")
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) throw new TimeError("Invalid dates")
  const days = Math.round((b.getTime() - a.getTime()) / 86400000)
  const weeks = Math.floor(Math.abs(days) / 7)
  const remDays = Math.abs(days) % 7
  return `${start} to ${end}:\n${Math.abs(days)} day(s) apart${weeks ? ` (${weeks} week(s) and ${remDays} day(s))` : ""}${days < 0 ? " (end before start)" : ""}`
}

// ---- muxA tools:
// The existing tools read the clock, convert one timestamp and measure the gap
// between two dates. These answer calendar questions about one date and do
// calendar aware arithmetic on it. Both are pure computation with no network.

export interface WeekInfoArgs {
  date?: string;
}

export interface AddDurationArgs {
  start?: string;
  duration?: string;
}

