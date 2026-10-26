export class HackTargetError extends Error {
    constructor(message) {
        super(message);
        this.name = "HackTargetError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.hackertarget.com";
async function req(path, params, text = false) {
    void params;
    let res;
    try {
        res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: text ? "text/plain" : "application/json" } });
    }
    catch (e) {
        throw new HackTargetError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new HackTargetError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
export function dnsLookup(query) {
    return req(`/dnslookup/?q=${encodeURIComponent(query)}`, {}, true);
}
export function reverseDns(ip) {
    return req(`/reversedns/?q=${encodeURIComponent(ip)}`, {}, true);
}
export function whoisLookup(query) {
    return req(`/whois/?q=${encodeURIComponent(query)}`, {}, true);
}
export function geoIpLookup(query) {
    return req(`/geoip/?q=${encodeURIComponent(query)}`, {}, true);
}
export function httpHeaders(url) {
    return req(`/httpheaders/?q=${encodeURIComponent(url)}`, {}, true);
}
export function reverseIp(ip) {
    return req(`/reverseiplookup/?q=${encodeURIComponent(ip)}`, {}, true);
}
// ---- muxG tools:
// req() takes a full path, so the query string is built here.
