const BASE = 'https://api.gog.com/products';

export interface ProductArgs {
  id: number;
}

export async function product(args: ProductArgs): Promise<string> {
  const id = Math.floor(args.id ?? 0);
  if (!id) return 'Provide a product id.';
  const res = await fetch(`${BASE}/${id}?expand=downloads`, {
    headers: { 'User-Agent': 'mrfentmen-gog-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`GOG returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const s = (k: string) => (d[k] != null ? String(d[k]) : '');
  const prices = (d.price && typeof d.price === 'object' ? d.price as Record<string, unknown> : {});
  const ps = (k: string) => (prices[k] != null ? String(prices[k]) : '');
  const priceStr = ps('finalAmount') ? `$${ps('finalAmount')}${ps('discount') && Number(ps('discount')) > 0 ? ` (was $${ps('baseAmount')})` : ''}` : '';
  return [
    `${s('title')}${s('is_coming_soon') === 'true' ? ' [coming soon]' : ''}`,
    priceStr,
    s('development_status') ? `Status: ${s('development_status')}` : '',
    s('worksOn') ? `Platforms: ${(s('worksOn').match(/\w+/g) ?? []).join(', ')}` : '',
    s('purchase_link') ? `Link: ${s('purchase_link')}` : '',
  ].filter(Boolean).join('\n') || `No data for product ${id}.`;
}
