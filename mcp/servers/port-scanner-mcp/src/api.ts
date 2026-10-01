const UA = "mrfentmen-port-scanner-mcp/1.0"
export class PortError extends Error {}

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

// ---- gap4a2 tools:

export async function dnsRecords(args: { name: string; type?: string; limit?: number }): Promise<string> {
  const name = args.name.trim()
  if (!name || name.length > 253) throw new PortError('Provide a DNS name up to 253 characters.')
  const type = (args.type ?? 'A').toUpperCase()
  if (!['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'PTR', 'CAA'].includes(type)) throw new PortError('Unsupported DNS record type.')
  const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 10), 30))
  const query = new URLSearchParams({ name, type })
  const res = await fetch(`https://dns.google/resolve?${query}`, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new PortError(`Google Public DNS returned ${res.status}`)
  const d = await res.json() as { Status?: number; AD?: boolean; Answer?: Array<{ name?: string; type?: number; TTL?: number; data?: string }> }
  return [`DNS ${type} records for ${name} | response code ${d.Status ?? 'not reported'} | authenticated data ${d.AD === true ? 'yes' : d.AD === false ? 'no' : 'not reported'}`, ...(d.Answer?.length ? d.Answer.slice(0, limit).map(r => `${(r.name ?? 'not reported').slice(0,253)} | type ${r.type ?? 'not reported'} | TTL ${r.TTL ?? 'not reported'} seconds | ${(r.data ?? 'not reported').slice(0,500)}`) : ['No answer records reported.'])].join('\n')
}

