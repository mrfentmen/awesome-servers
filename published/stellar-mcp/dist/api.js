const BASE = 'https://horizon.stellar.org/ledgers';
export async function ledgers(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 5, 15));
    const params = new URLSearchParams({ order: 'desc', limit: String(limit) });
    const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-stellar-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Horizon returned ${res.status}`);
    const d = (await res.json());
    const rows = d._embedded?.records ?? [];
    if (!rows.length)
        return 'No ledgers returned.';
    return `Recent Stellar ledgers (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. sequence ${s('sequence')} | ops ${s('successful_transaction_count')} | closed ${String(s('closed_at') ?? '').slice(0, 19)}`;
        })
            .join('\n');
}
// ---- muxC tools:
const HORIZON_UA = "mrfentmen-stellar-mcp/1.0 (https://github.com/mrfentmen)";
async function horizon(path, ms = 25000) {
    const res = await fetch(`https://horizon.stellar.org${path}`, { headers: { "User-Agent": HORIZON_UA, Accept: "application/json" }, signal: AbortSignal.timeout(ms) });
    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Stellar Horizon returned ${res.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
    }
    return await res.json();
}
