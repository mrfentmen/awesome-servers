const BASE = 'https://api.fbi.gov/wanted/v1';
const UA = 'mrfentmen-fbi-wanted-mcp/1.0 (https://github.com/mrfentmen)';
export class FbiError extends Error {
}
async function get(url) {
    // The FBI Wanted API rate-limits per IP; retry 403/429 with a short backoff.
    for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', Referer: 'https://www.fbi.gov/wanted/' }, signal: AbortSignal.timeout(25000) });
        if (res.ok)
            return (await res.json());
        if ((res.status === 403 || res.status === 429) && attempt < 2) {
            // Akamai issues a challenge cookie on the first hit; give it time to clear.
            await new Promise((r) => setTimeout(r, attempt === 0 ? 10000 : 15000));
            continue;
        }
        throw new FbiError(`FBI Wanted returned ${res.status}`);
    }
    throw new FbiError('FBI Wanted request failed');
}
export async function wantedList(args) {
    const page = Math.max(1, Math.floor(args.page ?? 1));
    const pageSize = Math.max(1, Math.min(args.pageSize ?? 10, 50));
    const d = await get(`${BASE}/list?page=${page}&pageSize=${pageSize}`);
    const items = d.items ?? [];
    if (!items.length)
        return 'No wanted persons returned.';
    return `FBI Wanted (${d.total ?? '?'} total, page ${page}):\n` + items.map((it, i) => `${(page - 1) * pageSize + i + 1}. ${it.title ?? '?'} [${it.status ?? 'unknown'}]\n   ${(it.description ?? '').slice(0, 120)}\n   ${it.url ?? ''}`).join('\n');
}
export async function search(args) {
    const title = (args.title ?? '').trim();
    if (!title)
        throw new FbiError('Provide a search term');
    const pageSize = Math.max(1, Math.min(args.pageSize ?? 10, 50));
    const d = await get(`${BASE}/list?title=${encodeURIComponent(title)}&pageSize=${pageSize}`);
    const items = d.items ?? [];
    if (!items.length)
        return `No wanted persons matching "${title}".`;
    return `FBI Wanted matching "${title}" (${d.total ?? items.length} total, ${items.length} shown):\n` + items.map((it, i) => `${i + 1}. ${it.title ?? '?'} [${it.status ?? 'unknown'}]\n   ${(it.description ?? '').slice(0, 150)}${it.reward_text ? `\n   Reward: ${it.reward_text}` : ''}\n   ${it.url ?? ''}`).join('\n');
}
export async function topRewards(_args = {}) {
    const d = await get(`${BASE}/list?pageSize=50`);
    const items = (d.items ?? []).filter((it) => it.reward_text).slice(0, 10);
    if (!items.length)
        return 'No reward listings returned.';
    return `FBI Wanted with rewards:\n` + items.map((it, i) => `${i + 1}. ${it.title ?? '?'}\n   ${it.reward_text}\n   ${it.url ?? ''}`).join('\n');
}
export async function officeSummary(args = {}) {
    const sampleSize = Math.max(1, Math.min(args.sampleSize ?? 50, 50));
    const d = await get(`${BASE}/list?pageSize=${sampleSize}`);
    const items = d.items ?? [];
    if (!items.length)
        return 'The FBI Wanted list returned no entries.';
    const offices = new Map();
    const classifications = new Map();
    let withReward = 0;
    for (const it of items) {
        for (const office of it.field_offices ?? []) {
            offices.set(office, (offices.get(office) ?? 0) + 1);
        }
        const cls = it.poster_classification ?? 'unclassified';
        classifications.set(cls, (classifications.get(cls) ?? 0) + 1);
        if (it.reward_text && it.reward_text.trim())
            withReward += 1;
    }
    const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
    const lines = [
        `FBI Wanted, first ${items.length} of ${d.total ?? '?'} entries:`,
        `  carrying a reward offer: ${withReward} of ${items.length}`,
        `  by poster classification:`,
    ];
    for (const [name, count] of top(classifications, 10))
        lines.push(`    ${name}: ${count}`);
    lines.push(`  by field office (${offices.size} distinct in this sample):`);
    for (const [name, count] of top(offices, 12))
        lines.push(`    ${name}: ${count}`);
    lines.push('This counts only the sample above, so it describes those entries rather than the whole dataset.');
    return lines.join('\n');
}
