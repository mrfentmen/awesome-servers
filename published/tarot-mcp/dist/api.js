const BASE = "https://tarotapi.dev/api/v1";
const UA = "mrfentmen-tarot-mcp/1.0 (https://github.com/mrfentmen)";
export class TarotError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    if (res.status === 429)
        throw new TarotError("Tarot API rate limit hit, wait and retry");
    if (!res.ok)
        throw new TarotError(`Tarot API error ${res.status}`);
    return (await res.json());
}
function fmtCard(c) {
    const m = c?.meaning_up ?? "";
    return `${c?.name ?? "Unknown"} (${c?.name_short ?? ""})\n   ${m ? m.slice(0, 200) : "no meaning"}`;
}
export async function randomCards(args) {
    const count = Math.min(Math.max(args.count ?? 1, 1), 10);
    const d = await get(`${BASE}/cards/random?n=${count}`);
    const cards = d?.cards ?? [];
    if (!cards.length)
        return "No cards drawn";
    return cards.map((c, i) => `${i + 1}. ${fmtCard(c)}`).join("\n\n");
}
export async function cardInfo(args) {
    const card = (args.card ?? "").trim();
    if (!card)
        throw new TarotError("Provide a card short name like ar00 or ma00");
    const d = await get(`${BASE}/cards/${encodeURIComponent(card)}`);
    const c = d?.cards?.[0] ?? d;
    if (!c?.name)
        return "Card not found";
    return `# ${c.name}\nSuit: ${c.suit ?? "n/a"} | Value: ${c.value ?? "n/a"} | Type: ${c.type ?? "n/a"}\n\nUpright: ${c.meaning_up ?? "n/a"}\nReversed: ${c.meaning_rev ?? "n/a"}`;
}
// ---- muxC tools:
