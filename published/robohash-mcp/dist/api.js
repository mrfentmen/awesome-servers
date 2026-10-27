const BASE = 'https://robohash.org';
const UA = 'mrfentmen-robohash-mcp/1.0 (https://github.com/mrfentmen)';
function sanitize(text) {
    return text.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 64) || 'robohash';
}
export async function avatar(args) {
    const text = sanitize(args.text ?? '');
    const size = Math.max(32, Math.min(args.size ?? 300, 1024));
    const set = args.set;
    const sets = { 1: 'set1', 2: 'set2', 3: 'set3', 4: 'set4', 5: 'set5' };
    const url = `${BASE}/${encodeURIComponent(text)}.png?size=${size}x${size}${set && sets[set] ? `&set=${sets[set]}` : ''}&bgset=bg1`;
    // Lightweight HEAD probe to confirm the image is servable.
    try {
        const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
        if (!res.ok)
            return `Avatar URL (probe returned ${res.status}): ${url}`;
    }
    catch {
        // network hiccup: still return the constructed URL
    }
    return `Robot avatar for "${args.text ?? ''}": ${url}\nDownload or embed the PNG directly.`;
}
// ---- muxB tools:
import { createHash } from 'node:crypto';
const RH_UA = 'mrfentmen-robohash-mcp/1.0 (https://github.com/mrfentmen)';
const digest = (buf) => createHash('sha256').update(Buffer.from(buf)).digest('hex').slice(0, 12);
async function probeRobo(url) {
    const res = await fetch(url, { headers: { 'User-Agent': RH_UA }, signal: AbortSignal.timeout(20000) });
    const buf = await res.arrayBuffer();
    return {
        status: res.status,
        type: res.headers.get('content-type') ?? 'not reported',
        bytes: buf.byteLength,
        digest: digest(buf),
    };
}
export async function robohashCompare(args) {
    const text = sanitize(args.text ?? '') || 'robohash';
    const size = Math.max(32, Math.min((args.size ?? 200) || 200, 1024));
    const set = args.set;
    const sets = { 1: 'set1', 2: 'set2', 3: 'set3', 4: 'set4', 5: 'set5' };
    const setParam = set && sets[set] ? `&set=${sets[set]}` : '';
    const url = `${BASE}/${encodeURIComponent(text)}.png?size=${size}x${size}${setParam}&bgset=bg1`;
    const first = await probeRobo(url);
    const second = await probeRobo(url);
    const other = (args.otherSeeds ?? [])
        .map((s) => sanitize(String(s ?? '')))
        .filter(Boolean)
        .slice(0, 6);
    const lines = [
        `RoboHash determinism check for seed "${text}" at ${size}px${set && sets[set] ? ` on ${sets[set]}` : ''}:`,
        `* reference ${url}`,
        `* request 1 - HTTP ${first.status}, ${first.bytes.toLocaleString('en-US')} bytes, sha256:${first.digest}`,
        `* request 2 - HTTP ${second.status}, ${second.bytes.toLocaleString('en-US')} bytes, sha256:${second.digest}`,
        `  ${first.digest === second.digest && first.bytes === second.bytes ? 'Stable: the same seed returns the same image every time.' : 'Unstable: the same seed returned different bytes on two consecutive requests.'}`,
    ];
    if (!other.length) {
        lines.push('Provide otherSeeds to check which seeds collide with this one.');
        return lines.join('\n');
    }
    const lines2 = ['', 'Other seeds at the same size and set:'];
    let collisions = 0;
    for (const seed of other) {
        const otherUrl = `${BASE}/${encodeURIComponent(seed)}.png?size=${size}x${size}${setParam}&bgset=bg1`;
        try {
            const r = await probeRobo(otherUrl);
            const same = r.digest === first.digest && r.bytes === first.bytes;
            if (same)
                collisions += 1;
            lines2.push(`* ${seed} - HTTP ${r.status}, ${r.bytes.toLocaleString('en-US')} bytes, sha256:${r.digest}${same ? ' [collides with the reference seed]' : ' [distinct from the reference seed]'}`);
        }
        catch (e) {
            lines2.push(`* ${seed} - request failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    lines.push(...lines2);
    lines.push('');
    lines.push(collisions ? `${collisions} of ${other.length} comparison seed(s) render identically to "${text}".` : `None of the ${other.length} comparison seeds render identically to "${text}".`);
    return lines.join('\n');
}
