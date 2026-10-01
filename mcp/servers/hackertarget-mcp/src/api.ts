export class HackTargetError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "HackTargetError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.hackertarget.com";

async function req(path: string, params: Record<string, string | number | undefined>, text = false): Promise<string> {
  void params;
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: text ? "text/plain" : "application/json" } });
  } catch (e) {
    throw new HackTargetError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new HackTargetError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function dnsLookup(query: string): Promise<string> {
  return req(`/dnslookup/?q=${encodeURIComponent(query)}`, {}, true);
}

export function reverseDns(ip: string): Promise<string> {
  return req(`/reversedns/?q=${encodeURIComponent(ip)}`, {}, true);
}

export function whoisLookup(query: string): Promise<string> {
  return req(`/whois/?q=${encodeURIComponent(query)}`, {}, true);
}

export function geoIpLookup(query: string): Promise<string> {
  return req(`/geoip/?q=${encodeURIComponent(query)}`, {}, true);
}

export function httpHeaders(url: string): Promise<string> {
  return req(`/httpheaders/?q=${encodeURIComponent(url)}`, {}, true);
}

export function reverseIp(ip: string): Promise<string> {
  return req(`/reverseiplookup/?q=${encodeURIComponent(ip)}`, {}, true);
}

// ---- muxG tools:
// req() takes a full path, so the query string is built here.

