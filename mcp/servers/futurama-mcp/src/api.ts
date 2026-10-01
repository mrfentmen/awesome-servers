const BASE = 'https://api.sampleapis.com/futurama/characters';

export interface ListArgs {
  limit?: number;
}

export interface IdArgs {
  id: number;
}

export async function characters(args: ListArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-futurama-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`SampleAPIs returned ${res.status}`);
  const d = (await res.json()) as Array<Record<string, unknown>>;
  if (!d.length) return 'No characters returned.';
  return `Futurama characters (${Math.min(d.length, limit)} of ${d.length} shown):\n` +
    d.slice(0, limit).map((c, i) => {
      const name = (c.name ?? {}) as Record<string, unknown>;
      const first = String(name.first ?? '');
      const last = String(name.last ?? '');
      const species = String(c.species ?? '');
      return `${i + 1}. ${first} ${last} (${species})`;
    }).join('\n');
}

export async function character(args: IdArgs): Promise<string> {
  const id = Math.floor(args.id ?? 0);
  if (!id) return 'Provide a character id.';
  const res = await fetch(`${BASE}/${id}`, {
    headers: { 'User-Agent': 'mrfentmen-futurama-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`SampleAPIs returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const name = (d.name ?? {}) as Record<string, unknown>;
  const first = String(name.first ?? '');
  const last = String(name.last ?? '');
  const s = (k: string) => (d[k] != null ? String(d[k]) : '');
  const occupation = (d.occupation ?? {}) as Record<string, unknown>;
  const age = (d.age ?? '') as string;
  const quotes = (d.quotes ?? []) as Array<unknown>;
  return [
    `${first} ${last}`,
    `Species: ${s('species')} | Age: ${age}`,
    occupation ? `Occupation: ${String((occupation.primary ?? occupation) ?? '')}` : '',
    quotes.length ? `Quote: "${String(quotes[0])}"` : '',
  ].filter(Boolean).join('\n');
}

// ---- muxC tools:

