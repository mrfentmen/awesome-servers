const BASE = 'https://sourcegraph.com/.api/search/stream';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const q = encodeURIComponent(`context:global ${query} count:${limit * 4}`);
  const res = await fetch(`${BASE}?q=${q}`, {
    headers: { 'User-Agent': 'mrfentmen-sourcegraph-mcp/1.0', Accept: 'text/event-stream' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Sourcegraph returned ${res.status}`);
  const text = await res.text();
  const matches: Array<Record<string, unknown>> = [];
  for (const block of text.split('\n\n')) {
    const lines = block.split('\n');
    if (lines[0] !== 'event: matches') continue;
    const dataLine = lines.find((l) => l.startsWith('data: '));
    if (!dataLine) continue;
    try {
      const arr = JSON.parse(dataLine.slice(6)) as Array<Record<string, unknown>>;
      matches.push(...arr);
    } catch {
      /* skip malformed event */
    }
  }
  if (!matches.length) return 'No matches found.';
  const rows = matches.slice(0, limit);
  const out: string[] = [`Code matches (${rows.length} shown):`];
  for (const m of rows) {
    const repo = String(m.repository ?? '');
    const path = String(m.path ?? '');
    const lm = (m.lineMatches as Array<{ line: string }> | undefined) ?? [];
    const lines = lm.slice(0, 2).map((x) => x.line.trim().slice(0, 90)).join(' | ');
    out.push(`- ${repo} :: ${path}${lines ? ` :: ${lines}` : ''}`);
  }
  return out.join('\n');
}

// ---- muxB tools:

async function streamEvents(query: string, wanted: string): Promise<Array<Record<string, unknown>>> {
  const q = encodeURIComponent(`context:global ${query}`);
  const res = await fetch(`${BASE}?q=${q}`, {
    headers: { 'User-Agent': 'mrfentmen-sourcegraph-mcp/1.0', Accept: 'text/event-stream' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Sourcegraph returned ${res.status}`);
  const text = await res.text();
  const matches: Array<Record<string, unknown>> = [];
  for (const block of text.split('\n\n')) {
    const lines = block.split('\n');
    if (lines[0] !== `event: ${wanted}`) continue;
    const dataLine = lines.find((l) => l.startsWith('data: '));
    if (!dataLine) continue;
    try {
      const arr = JSON.parse(dataLine.slice(6)) as Array<Record<string, unknown>>;
      matches.push(...arr);
    } catch {
      /* skip malformed event */
    }
  }
  return matches;
}

export interface SearchReposArgs {
  query: string;
  limit?: number;
}

export interface SearchPathsArgs {
  query: string;
  limit?: number;
}

