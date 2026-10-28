/**
 * IP Subnet — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "IP Subnet"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "ip-subnet-mcp", accept },
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

const ipToInt = (ip: string): number => {
  const parts = ip.trim().split(".")
  if (parts.length !== 4) throw new SourceError(`"${ip}" is not an IPv4 address`)
  let n = 0
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) throw new SourceError(`"${ip}" is not an IPv4 address`)
    const v = Number(p)
    if (v > 255) throw new SourceError(`"${ip}" has an octet above 255`)
    n = n * 256 + v
  }
  return n >>> 0
}

const intToIp = (n: number): string => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".")

function parseCidr(cidr: string): { base: number; prefix: number } {
  const m = cidr.trim().match(/^([0-9.]+)\/(\d{1,2})$/)
  if (!m) throw new SourceError(`"${cidr}" is not CIDR notation, e.g. 10.0.0.0/8`)
  const prefix = Number(m[2])
  if (prefix < 0 || prefix > 32) throw new SourceError("prefix must be between 0 and 32")
  const base = ipToInt(m[1]) & (prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0)
  return { base, prefix }
}

export async function describeSubnet(a: { cidr: string }): Promise<string> {
  const { base, prefix } = parseCidr(a.cidr)
  const size = 2 ** (32 - prefix)
  const broadcast = (base + size - 1) >>> 0
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const wildcard = (~mask) >>> 0
  const usable = prefix >= 31 ? 0 : size - 2
  const first = prefix >= 31 ? base : base + 1
  const last = prefix >= 31 ? broadcast : broadcast - 1
  const firstOctet = base >>> 24
  const cls = firstOctet < 128 ? "A" : firstOctet < 192 ? "B" : firstOctet < 224 ? "C" : firstOctet < 240 ? "D (multicast)" : "E (reserved)"
  const priv = base >= ipToInt("10.0.0.0") && broadcast <= ipToInt("10.255.255.255")
    || base >= ipToInt("172.16.0.0") && broadcast <= ipToInt("172.31.255.255")
    || base >= ipToInt("192.168.0.0") && broadcast <= ipToInt("192.168.255.255")
    || base >= ipToInt("127.0.0.0") && broadcast <= ipToInt("127.255.255.255")
  return [
    `${intToIp(base)}/${prefix}`,
    `Network: ${intToIp(base)}`,
    `Broadcast: ${intToIp(broadcast)}`,
    `Netmask: ${intToIp(mask)}`,
    `Wildcard: ${intToIp(wildcard)}`,
    `Host range: ${usable === 0 ? "none (point-to-point)" : `${intToIp(first)} - ${intToIp(last)}`}`,
    `Addresses: ${size.toLocaleString("en-US")} (${usable.toLocaleString("en-US")} usable)`,
    `Class: ${cls}`,
    `Scope: ${priv ? "private / loopback" : "public"}`,
  ].join("\n")
}

export async function checkIp(a: { cidr: string; ip: string }): Promise<string> {
  const { base, prefix } = parseCidr(a.cidr)
  const size = 2 ** (32 - prefix)
  const ip = ipToInt(a.ip)
  const end = base + size - 1
  const inside = ip >= base && ip <= end
  const edge = ip === base ? "network address" : ip === end ? "broadcast address" : inside ? "usable host" : ""
  return `${a.ip} is ${inside ? "inside" : "outside"} ${a.cidr}${edge ? ` (${edge})` : ""}`
}

export async function splitSubnet(a: { cidr: string; newPrefix: number }): Promise<string> {
  const { base, prefix } = parseCidr(a.cidr)
  if (a.newPrefix <= prefix) throw new SourceError(`new prefix /${a.newPrefix} must be longer than /${prefix}`)
  if (a.newPrefix > 32) throw new SourceError("new prefix cannot exceed /32")
  const count = 2 ** (a.newPrefix - prefix)
  if (count > 256) throw new SourceError(`that would create ${count} subnets; ask for at most 256`)
  const step = 2 ** (32 - a.newPrefix)
  const rows: string[] = []
  for (let i = 0; i < count; i++) {
    const net = (base + i * step) >>> 0
    rows.push(`${i + 1}. ${intToIp(net)}/${a.newPrefix}  (${intToIp(net)} - ${intToIp((net + step - 1) >>> 0)})`)
  }
  return [`${a.cidr} split into ${count} x /${a.newPrefix}:`, ...rows].join("\n")
}
