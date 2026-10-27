const RPC = 'https://api.mainnet-beta.solana.com';
export async function slot(_args) {
    const res = await fetch(RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'mrfentmen-solana-mcp/1.0' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot' }),
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Solana returned ${res.status}`);
    const d = (await res.json());
    if (d.error)
        throw new Error(`Solana RPC error: ${d.error.message ?? 'unknown'}`);
    return `Current Solana slot: ${d.result ?? 'unknown'}`;
}
// ---- muxC tools:
const SOL_RPC = "https://api.mainnet-beta.solana.com";
async function rpc(method, params = []) {
    const res = await fetch(SOL_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "mrfentmen-solana-mcp/1.0" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Solana RPC returned ${res.status}; it requires a JSON content type`);
    const d = (await res.json());
    if (d.error)
        throw new Error(`Solana RPC error on ${method}: ${d.error.message ?? "unknown"}`);
    return d.result;
}
