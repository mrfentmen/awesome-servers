const UA = 'mrfentmen-independent-reserve-mcp/1.0';
export async function ticker(args) {
    const primary = (args.primary ?? '').trim().toLowerCase();
    const secondary = (args.secondary ?? '').trim().toLowerCase();
    if (!primary || !secondary)
        return 'Provide primary and secondary currencies like btc and usd.';
    const url = `https://api.independentreserve.com/Public/GetMarketSummary?primaryCurrencyCode=${encodeURIComponent(primary)}&secondaryCurrencyCode=${encodeURIComponent(secondary)}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Independent Reserve returned ${res.status}`);
    const d = (await res.json());
    if (d.Message)
        throw new Error(`Independent Reserve: ${String(d.Message)}`);
    const get = (k) => String(d[k] ?? '?');
    return [
        `Independent Reserve ${primary}/${secondary}:`,
        `Last: ${get('LastPrice')} | Bid: ${get('CurrentHighestBidPrice')} | Ask: ${get('CurrentLowestOfferPrice')}`,
        `Day high: ${get('DayHighestPrice')} | Day low: ${get('DayLowestPrice')} | Day avg: ${get('DayAvgPrice')}`,
        `24h volume: ${get('DayVolumeXbt')} ${primary.toUpperCase()}`,
    ].filter(Boolean).join('\n');
}
