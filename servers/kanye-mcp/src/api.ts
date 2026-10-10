const BASE = 'https://api.kanye.rest';

export async function random(_args: Record<string, never> = {}): Promise<string> {
  const res = await fetch(`${BASE}/`, {
    headers: { 'User-Agent': 'mrfentmen-kanye-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`kanye.rest returned ${res.status}`);
  const data = (await res.json()) as { quote?: string };
  if (!data.quote) throw new Error('kanye.rest returned an empty quote');
  return data.quote;
}

// ---- muxC tools:

