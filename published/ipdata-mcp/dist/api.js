/**
 * Thin HTTP layer for the ipdata.co API. Reads the key from the environment
 * (never from arguments) and turns non-2xx responses into plain errors.
 */
import { buildBulkUrl, buildLookupUrl, validateBulkIps, validateLookupIp } from './util.js';
export function requireApiKey() {
    const key = process.env.IPDATA_API_KEY;
    if (!key || key.trim() === '') {
        throw new Error('IPDATA_API_KEY is not set. Get a free key at https://ipdata.co and export it before starting this server.');
    }
    return key.trim();
}
export function euEndpoint() {
    return process.env.IPDATA_EU === '1' || process.env.IPDATA_EU === 'true';
}
export async function ipdataGet(ip) {
    const key = requireApiKey();
    const checked = ip ? validateLookupIp(ip) : undefined;
    const url = buildLookupUrl(checked, key, euEndpoint());
    const resp = await fetch(url, { headers: { accept: 'application/json' } });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`ipdata lookup failed: HTTP ${resp.status} ${text.slice(0, 300)}`);
    }
    return resp.json();
}
export async function ipdataBulk(ips) {
    const key = requireApiKey();
    const checked = validateBulkIps(ips);
    const url = buildBulkUrl(key, euEndpoint());
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ ips: checked }),
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`ipdata bulk lookup failed: HTTP ${resp.status} ${text.slice(0, 300)}`);
    }
    return resp.json();
}
