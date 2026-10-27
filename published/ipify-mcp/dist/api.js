const BASE = 'https://api.ipify.org?format=json';
export async function myip(_args = {}) {
    const res = await fetch(BASE, {
        headers: { 'User-Agent': 'mrfentmen-ipify-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new Error(`ipify returned ${res.status}`);
    const data = (await res.json());
    if (!data.ip)
        throw new Error('ipify returned an empty response');
    return `Your public IP address is ${data.ip}`;
}
// ---- muxA tools:
// The existing tool only ever reads the IPv4 endpoint. These read the dual
// stack endpoint as well, which answers with the IPv6 address when the caller
// has one, so the two address families can be told apart.
const API64 = 'https://api64.ipify.org?format=json';
function family(ip) {
    if (ip.includes(':'))
        return 'IPv6';
    return ip.split('.').length === 4 ? 'IPv4' : 'unknown family';
}
async function addressOf(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-ipify-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new Error(`ipify returned ${res.status}`);
    const data = (await res.json());
    if (!data.ip)
        throw new Error('ipify returned an empty response');
    return data.ip;
}
export async function myIpv6(_args = {}) {
    const ip = await addressOf(API64);
    const kind = family(ip);
    if (kind === 'IPv6')
        return `Your public IPv6 address is ${ip}`;
    return `The dual stack endpoint answered ${ip}, which is ${kind}, so this connection has no IPv6 address to report.`;
}
