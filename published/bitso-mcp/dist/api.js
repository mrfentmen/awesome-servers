const UA = 'mrfentmen-bitso-mcp/1.0';
export async function ticker(args) {
    const book = (args.book ?? '').trim().toLowerCase();
    if (!book)
        return 'Provide a book like btc_mxn.';
    const res = await fetch(`https://api.bitso.com/v3/ticker/?book=${encodeURIComponent(book)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Bitso returned ${res.status}`);
    const d = (await res.json());
    if (!d.success || !d.payload)
        throw new Error('Bitso: no ticker data');
    const p = d.payload;
    return [
        `Bitso ${book}:`,
        `Last: ${p.last ?? '?'} MXN | Bid: ${p.bid ?? '?'} | Ask: ${p.ask ?? '?'}`,
        `High: ${p.high ?? '?'} | Low: ${p.low ?? '?'} | Volume: ${p.volume ?? '?'}`,
        `Updated: ${p.created_at ?? '?'}`,
    ].filter(Boolean).join('\n');
}
async function bitsoGet(path) {
    const res = await fetch(`https://api.bitso.com/v3${path}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Bitso returned ${res.status}`);
    const d = (await res.json());
    if (!d.success || d.payload === undefined)
        throw new Error("Bitso: no data in response");
    return d.payload;
}
export async function tradingFees(args) {
    const all = await bitsoGet("/available_books/");
    if (!Array.isArray(all) || !all.length)
        return "Bitso returned no tradable books.";
    const wanted = (args.book ?? "").trim().toLowerCase();
    if (wanted) {
        const hit = all.find((b) => b.book === wanted);
        if (!hit) {
            return `Bitso lists no "${wanted}" book. It currently lists ${all.length} books.`;
        }
        const tiers = (hit.fees?.structure ?? []).slice(0, 9);
        return [
            `Bitso trading limits and fees for ${wanted}:`,
            `  Maker fee (flat) : ${hit.fees?.flat_rate?.maker ?? "not reported"}`,
            `  Taker fee (flat) : ${hit.fees?.flat_rate?.taker ?? "not reported"}`,
            `  Tick size        : ${hit.tick_size ?? "not reported"}`,
            `  Minimum amount   : ${hit.minimum_amount ?? "not reported"}`,
            `  Maximum amount   : ${hit.maximum_amount ?? "not reported"}`,
            `  Minimum value    : ${hit.minimum_value ?? "not reported"}`,
            `  Maximum value    : ${hit.maximum_value ?? "not reported"}`,
            `  Price range      : ${hit.minimum_price ?? "not reported"} — ${hit.maximum_price ?? "not reported"}`,
            `  Margin enabled   : ${hit.margin_enabled === true ? "yes" : "no"}`,
            `  Volume tiers (${tiers.length}):`,
            ...tiers.map((t) => `      volume ${t.volume ?? "?"} → maker ${t.maker ?? "?"} / taker ${t.taker ?? "?"}`),
        ].join("\n");
    }
    return [
        `Bitso lists ${all.length} books. Pass a book like btc_mxn for its full fee schedule.`,
        `  First 8 (flat maker / taker):`,
        ...all
            .slice(0, 8)
            .map((b) => `      ${(b.book ?? "?").padEnd(12)} maker ${b.fees?.flat_rate?.maker ?? "?"} / taker ${b.fees?.flat_rate?.taker ?? "?"}  tick ${b.tick_size ?? "?"}`),
    ].join("\n");
}
