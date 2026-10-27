const UA = 'mrfentmen-mtg-mcp/1.0';
export async function cards(args) {
    const name = (args.name ?? '').trim();
    if (!name)
        return 'Provide a card name.';
    const limit = Math.min(Math.max(Number(args.limit ?? 5) || 5, 1), 20);
    const res = await fetch(`https://api.magicthegathering.io/v1/cards?name=${encodeURIComponent(name)}&pageSize=${limit}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`MTG API returned ${res.status}`);
    const d = (await res.json());
    const list = d.cards ?? [];
    if (!list.length)
        return `No MTG cards for "${name}".`;
    return `MTG cards for "${name}" (${list.length}):\n` +
        list.slice(0, limit).map((c, i) => `${i + 1}. ${c.name ?? '?'} (${c.rarity ?? '?'}, ${c.set ?? '?'}) | ${c.type ?? '?'} | cost: ${c.manaCost ?? 'none'} | P/T: ${c.power ?? '?'}/${c.toughness ?? '?'}`).join('\n');
}
export async function sets(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 50);
    const res = await fetch(`https://api.magicthegathering.io/v1/sets?pageSize=${limit}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`MTG API returned ${res.status}`);
    const d = (await res.json());
    const list = d.sets ?? [];
    if (!list.length)
        return 'No sets returned.';
    return `MTG sets (${list.length}):\n` +
        list.slice(0, limit).map((s, i) => `${i + 1}. [${s.code ?? '?'}] ${s.name ?? '?'} (${s.type ?? '?'}, released ${s.releaseDate ?? '?'})`).join('\n');
}
// ---- muxB tools:
const SCY = 'https://api.scryfall.com';
async function scy(path, label) {
    const res = await fetch(`${SCY}${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new Error(`Scryfall has no ${label} matching that.`);
    if (res.status === 400)
        throw new Error(`Scryfall rejected that ${label} query.`);
    if (!res.ok)
        throw new Error(`Scryfall returned ${res.status} for ${label}`);
    return (await res.json());
}
const q = (v) => encodeURIComponent(v);
