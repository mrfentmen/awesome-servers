/**
 * DNS Lookup — keyless public API client.
 */

export class SourceError extends Error {}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

import { resolve4, resolve6, resolveMx, resolveTxt, resolveNs, resolveCname, resolveSoa, resolveCaa, resolveSrv, reverse } from "node:dns/promises"

const HOST = /^(?=.{1,253}$)([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)*[A-Za-z]{2,63}\.?$/

function checkHost(value: string, label = "name"): string {
  const host = clean(value).toLowerCase().replace(/\.$/, "")
  if (!HOST.test(host)) throw new SourceError(`"${value}" does not look like a ${label}`)
  return host
}

async function withTimeout<T>(promise: Promise<T>, what: string, ms = 10000): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new SourceError(`${what} timed out after ${ms / 1000} seconds`)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}

export async function resolveHost(a: { name: string; type?: string }): Promise<string> {
  const name = checkHost(a.name)
  const type = (clean(a.type) || "A").toUpperCase()
  const lookup = async (): Promise<{ label: string; rows: string[] }> => {
    switch (type) {
      case "A": {
        const rows = await withTimeout(resolve4(name), "the DNS lookup")
        return { label: "A", rows: rows.map((ip) => ip) }
      }
      case "AAAA": {
        const rows = await withTimeout(resolve6(name), "the DNS lookup")
        return { label: "AAAA", rows: rows.map((ip) => ip) }
      }
      case "MX": {
        const rows = await withTimeout(resolveMx(name), "the DNS lookup")
        return { label: "MX", rows: rows.map((r) => `${r.priority} ${r.exchange}`) }
      }
      case "TXT": {
        const rows = await withTimeout(resolveTxt(name), "the DNS lookup")
        return { label: "TXT", rows: rows.map((parts) => parts.join("")) }
      }
      case "NS": {
        const rows = await withTimeout(resolveNs(name), "the DNS lookup")
        return { label: "NS", rows }
      }
      case "CNAME": {
        const rows = await withTimeout(resolveCname(name), "the DNS lookup")
        return { label: "CNAME", rows }
      }
      case "SOA": {
        const row = await withTimeout(resolveSoa(name), "the DNS lookup")
        return { label: "SOA", rows: [`${row.nsname} ${row.hostmaster} serial ${row.serial} refresh ${row.refresh} retry ${row.retry} expire ${row.expire} min ${row.minttl}`] }
      }
      case "CAA": {
        const rows = await withTimeout(resolveCaa(name), "the DNS lookup")
        return { label: "CAA", rows: rows.map((r) => `${r.critical ? "critical " : ""}${r.issue ? `issue ${r.issue}` : r.issuewild ? `issuewild ${r.issuewild}` : `iodef ${r.iodef ?? ""}`}`.trim()) }
      }
      case "SRV": {
        const rows = await withTimeout(resolveSrv(name), "the DNS lookup")
        return { label: "SRV", rows: rows.map((r) => `${r.priority} ${r.weight} ${r.port} ${r.name}`) }
      }
      default:
        throw new SourceError("type must be one of A, AAAA, MX, TXT, NS, CNAME, SOA, CAA, SRV (for SRV pass _service._proto.name)")
    }
  }
  const { label, rows } = await lookup()
  if (!rows.length) throw new SourceError(`no ${label} records for ${name}`)
  return [
    `${rows.length} ${label} record(s) for ${name}:`,
    "",
    ...rows.slice(0, 40),
  ].join("\n")
}

export async function reverseLookup(a: { ip: string }): Promise<string> {
  const ip = clean(a.ip)
  if (!/^[0-9a-fA-F:.]+$/.test(ip)) throw new SourceError(`"${a.ip}" is not an IP address`)
  const names = await withTimeout(reverse(ip), "the reverse lookup")
  if (!names.length) throw new SourceError(`no PTR record for ${ip}`)
  return [`${names.length} PTR record(s) for ${ip}:`, "", ...names].join("\n")
}

export async function emailDeliverability(a: { domain: string }): Promise<string> {
  const domain = checkHost(a.domain, "domain name")
  const checks: string[] = []
  let mx: Array<{ priority: number; exchange: string }> = []
  try {
    mx = await withTimeout(resolveMx(domain), "the MX lookup")
  } catch (e) {
    if (e instanceof SourceError) throw e
    return `No MX records for ${domain} — the domain cannot receive email at all.`
  }
  const nullMx = mx.some((r) => r.exchange === "" || r.exchange === ".")
  checks.push(`MX: ${mx.length} record(s)${nullMx ? " including a null MX (the domain refuses mail)" : ""}`)
  for (const r of mx.slice(0, 8)) checks.push(`  ${r.priority} ${r.exchange}`)
  const txt = await withTimeout(resolveTxt(domain), "the TXT lookup").catch(() => [] as string[][])
  const spf = txt.map((parts) => parts.join("")).find((t) => t.toLowerCase().startsWith("v=spf1"))
  checks.push(spf ? `SPF: ${spf}` : "SPF: no v=spf1 record found")
  const dmarc = await withTimeout(resolveTxt(`_dmarc.${domain}`), "the DMARC lookup").catch(() => [] as string[][])
  const dmarcRecord = dmarc.map((parts) => parts.join("")).find((t) => t.toLowerCase().startsWith("v=dmarc1"))
  checks.push(dmarcRecord ? `DMARC: ${dmarcRecord}` : "DMARC: no _dmarc record found")
  return [
    `Email set-up for ${domain}:`,
    "",
    ...checks,
    "",
    nullMx ? "This domain publishes a null MX, so senders should not deliver mail to it." : "A null MX is not present, so mail can be delivered.",
  ].join("\n")
}
