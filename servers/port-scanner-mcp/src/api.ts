import { connect } from "node:net"

const UA = "mrfentmen-port-scanner-mcp/1.0"
export class PortError extends Error {}

function check(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = connect({ host, port })
    let done = false
    const finish = (open: boolean) => {
      if (done) return
      done = true
      sock.destroy()
      resolve(open)
    }
    sock.setTimeout(timeoutMs)
    sock.once("connect", () => finish(true))
    sock.once("timeout", () => finish(false))
    sock.once("error", () => finish(false))
  })
}

export async function scanHost(args: { host?: string; ports?: string; timeout_ms?: number }): Promise<string> {
  const host = (args.host ?? "").trim()
  if (!host) throw new PortError("Provide a host name or IP")
  const timeoutMs = Math.min(Math.max(args.timeout_ms ?? 1000, 100), 2000)
  const ports = (args.ports ?? "80,443,22,21,25,53,8080,3306,5432,6379")
    .split(",").map((p) => parseInt(p.trim(), 10)).filter((p) => p >= 1 && p <= 65535).slice(0, 50)
  if (!ports.length) throw new PortError("Provide a valid port list")
  const results: string[] = []
  for (const p of ports) {
    const open = await check(host, p, timeoutMs)
    results.push(`${p}: ${open ? "OPEN" : "closed"}`)
  }
  return `Scan of ${host}:\n${results.join("\n")}`
}

export async function scanCommon(args: { host?: string }): Promise<string> {
  const host = (args.host ?? "").trim()
  if (!host) throw new PortError("Provide a host name or IP")
  const common = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 993, 995, 1433, 1521, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9000, 27017]
  const results: string[] = []
  for (const p of common) {
    const open = await check(host, p, 800)
    if (open) results.push(`${p}: OPEN`)
  }
  return results.length
    ? `Open ports on ${host}:\n${results.join("\n")}`
    : `No common ports open on ${host}`
}

// ---- muxB tools:
const MAX_PORTS = 4096
const MAX_SPEC = 20000
const MAX_REPORT = 200000
const STATES = ["open", "closed", "filtered", "timeout", "refused", "unreachable"] as const

type State = (typeof STATES)[number]

function pad(label: string, width = 20): string {
  return label.length >= width ? label : label + " ".repeat(width - label.length)
}

function runsOf(sorted: number[]): Array<[number, number]> {
  const runs: Array<[number, number]> = []
  for (const port of sorted) {
    const last = runs[runs.length - 1]
    if (last && port === last[1] + 1) last[1] = port
    else runs.push([port, port])
  }
  return runs
}

function formatRuns(runs: Array<[number, number]>, limit = 12): string {
  if (!runs.length) return "none"
  const shown = runs.slice(0, limit).map(([from, to]) => (from === to ? String(from) : `${from}-${to}`))
  return shown.join(", ") + (runs.length > limit ? `, +${runs.length - limit} more` : "")
}

export async function parsePortSpec(args: { spec?: string; max_ports?: number }): Promise<string> {
  const spec = (args.spec ?? "").trim()
  if (!spec) throw new Error("Provide a port specification in spec, for example 22,80,8000-8010")
  if (spec.length > MAX_SPEC) throw new Error(`Keep spec under ${MAX_SPEC} characters`)
  const cap = Math.min(MAX_PORTS, Math.max(1, Math.trunc(Number(args.max_ports ?? MAX_PORTS) || MAX_PORTS)))
  const accepted: number[] = []
  const rejected: string[] = []
  let duplicates = 0
  const seen = new Set<number>()
  for (const chunk of spec.split(/[\s,;]+/).filter(Boolean)) {
    const range = /^(\d{1,5})\s*[-:.]{1,2}\s*(\d{1,5})$/.exec(chunk)
    const single = /^(\d{1,5})$/.exec(chunk)
    let from: number
    let to: number
    if (range) {
      from = Number(range[1])
      to = Number(range[2])
      if (from > to) {
        rejected.push(`${chunk} (range runs backwards)`)
        continue
      }
      if (to - from + 1 > cap) {
        rejected.push(`${chunk} (expands to more than ${cap} ports)`)
        continue
      }
    } else if (single) {
      from = Number(single[1])
      to = from
    } else {
      rejected.push(`${chunk} (not a port or a range)`)
      continue
    }
    if (from < 1 || to > 65535) {
      rejected.push(`${chunk} (outside 1-65535)`)
      continue
    }
    for (let port = from; port <= to; port += 1) {
      if (seen.has(port)) {
        duplicates += 1
        continue
      }
      seen.add(port)
      accepted.push(port)
    }
  }
  accepted.sort((a, b) => a - b)
  const acceptedRuns = runsOf(accepted)
  const out: string[] = []
  out.push(`Port specification expansion (${spec.length} characters of input)`)
  out.push(`${pad("Accepted")}${accepted.length} distinct ports, lowest ${accepted[0] ?? "none"}, highest ${accepted[accepted.length - 1] ?? "none"}`)
  out.push(`${pad("Ranges found")}${acceptedRuns.length} contiguous run${acceptedRuns.length === 1 ? "" : "s"}: ${formatRuns(acceptedRuns, 20)}`)
  out.push(`${pad("Duplicates")}${duplicates} repeated port${duplicates === 1 ? "" : "s"} collapsed away`)
  out.push(`${pad("Rejected")}${rejected.length} entr${rejected.length === 1 ? "y" : "ies"}`)
  for (const item of rejected.slice(0, 12)) out.push(`  - ${item}`)
  if (rejected.length > 12) out.push(`  +${rejected.length - 12} more rejected entries not listed`)
  out.push(`${pad("To scan")}${accepted.length ? `spec = "${accepted.slice(0, 40).join(",")}${accepted.length > 40 ? ",..." : ""}"` : "nothing valid to scan, fix the specification first"}`)
  if (accepted.length > 40) out.push(`  the scan_host ports field holds the full list; ${accepted.length} ports is ${Math.ceil(accepted.length / 10)} times the 50 port cap in one call`)
  return out.join("\n")
}

export async function summarizeScanResults(args: { report?: string }): Promise<string> {
  const report = args.report ?? ""
  if (!report.trim()) throw new Error("Paste a scan report into report to summarise")
  if (report.length > MAX_REPORT) throw new Error(`Keep report under ${MAX_REPORT} characters`)
  const counts: Record<string, number> = Object.fromEntries(STATES.map((state) => [state, 0]))
  const open: number[] = []
  const all: number[] = []
  let parsed = 0
  let ignored = 0
  for (const line of report.split(/\r?\n/)) {
    const match = /(?:^|\s)(\d{1,5})\s*[:=\-]?\s*(open|closed|filtered|timeout|refused|unreachable)\b/i.exec(line)
    if (!match) {
      if (line.trim()) ignored += 1
      continue
    }
    const port = Number(match[1])
    if (port < 1 || port > 65535) {
      ignored += 1
      continue
    }
    const state = match[2].toLowerCase() as State
    counts[state] += 1
    parsed += 1
    all.push(port)
    if (state === "open") open.push(port)
  }
  const out: string[] = []
  out.push(`Scan report summary (${report.length} characters pasted)`)
  if (!parsed) {
    out.push(`${pad("Result")}no "port: state" line was recognised, ${ignored} line${ignored === 1 ? "" : "s"} ignored`)
    out.push("Expected lines look like \"8080: OPEN\" or \"443 closed\".")
    return out.join("\n")
  }
  const total = parsed
  const openSorted = [...open].sort((a, b) => a - b)
  out.push(`${pad("Parsed")}${parsed} port lines, ${ignored} line${ignored === 1 ? "" : "s"} ignored`)
  out.push(`${pad("States")}${STATES.filter((state) => counts[state] > 0).map((state) => `${state} ${counts[state]}`).join("  ")}`)
  out.push(`${pad("Open ratio")}${((counts.open / total) * 100).toFixed(1)}% of ${total} probed ports answered`)
  const runs = runsOf(openSorted)
  out.push(`${pad("Open ports")}${openSorted.length ? formatRuns(runs, 30) : "none"}`)
  out.push(`${pad("Highest open")}${openSorted.length ? openSorted[openSorted.length - 1] : "not reported - no port answered"}`)
  out.push(`${pad("Contiguous runs")}${runs.length} run${runs.length === 1 ? "" : "s"}: ${formatRuns(runs, 12)}`)
  const longest = runs.reduce((max, run) => Math.max(max, run[1] - run[0] + 1), 0)
  const isolated = runs.filter(([from, to]) => from === to).length
  out.push(`${pad("Pattern")}longest contiguous open run ${longest} port${longest === 1 ? "" : "s"}, ${isolated} isolated open port${isolated === 1 ? "" : "s"}`)
  const sorted = [...new Set(all)].sort((a, b) => a - b)
  out.push(`${pad("Coverage")}${new Set(all).size} distinct ports probed, spanning ${sorted.length ? `${sorted[0]} to ${sorted[sorted.length - 1]}` : "not reported"}`)
  out.push(`${pad("Reading")}${counts.open === 0 ? "nothing answered, so either the host is down or every probed port is filtered" : longest >= 3 ? "a contiguous block answered, which usually means one service listening on a range" : counts.open <= 2 ? "only one or two ports answered, which is a small attack surface" : "several scattered ports answered, worth reviewing individually"}`)
  return out.join("\n")
}
