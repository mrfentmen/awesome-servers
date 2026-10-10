const BASE = 'https://api.dailymotion.com/videos';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide a search query.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
  const res = await fetch(`${BASE}?search=${encodeURIComponent(q)}&limit=${limit}&fields=id,title,url,duration,views_total`, {
    headers: { 'User-Agent': 'mrfentmen-dailymotion-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Dailymotion returned ${res.status}`);
  const data = (await res.json()) as {
    total?: number;
    list?: Array<Record<string, unknown>>;
  };
  const rows = data.list ?? [];
  if (!rows.length) return `No Dailymotion videos for "${q}".`;
  return `Dailymotion videos for "${q}" (${data.total ?? rows.length} total, ${rows.length} shown):\n` +
    rows
      .map((v, i) => {
        const dur = typeof v.duration === 'number' ? `${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2, '0')}` : '';
        const views = typeof v.views_total === 'number' ? ` | ${v.views_total.toLocaleString()} views` : '';
        return `${i + 1}. ${v.title ?? 'untitled'} | ${dur}${views}\n   ${v.url ?? ''}`;
      })
      .join('\n');
}

// ---- muxA tools:
// The existing tool searches by text and returns id, title, url, duration and
// views. These tools add the parts of the same public API that search cannot
// reach: the full record behind a known video id, browsing one of the fixed
// channels with the sort orders the API really supports, and the channel list
// itself.
const DM_BASE = "https://api.dailymotion.com"
const DM_UA = "mrfentmen-dailymotion-mcp/1.0"

// Taken from the API's own rejection message for an unknown sort, then
// re-checked against the live endpoint one value at a time.

// Every endpoint is a plain JSON GET. A rejected parameter answers a 400 whose
// body names the parameter and, for a bad sort or field, lists the accepted
// values, so the body is read even on a failure rather than throwing the code.
async function dmGet(path: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const url = new URL(DM_BASE + path)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": DM_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null
  if (!res.ok) {
    const error = body?.error as { message?: string } | undefined
    throw new Error(error?.message ? `Dailymotion: ${error.message}` : `Dailymotion returned ${res.status}`)
  }
  if (!body) throw new Error("Dailymotion returned a body that is not JSON")
  return body
}

function dmRows(body: Record<string, unknown>): Array<Record<string, unknown>> {
  return Array.isArray(body.list) ? (body.list as Array<Record<string, unknown>>) : []
}

// Search answers a hard cap of 1000 for the total whatever the query, verified
// on five common words that each returned exactly 1000 with has_more true, so
// the figure is reported as a ceiling and never as the amount that exists.

function dmField(row: Record<string, unknown>, key: string): string {
  const value = row[key]
  return typeof value === "string" && value.length > 0 ? value : "unknown"
}

// The detail fields, in one list so both the single and the bulk route ask for
// exactly the same shape.

export async function channelIndex(args: Record<string, unknown>): Promise<string> {
  void args
  const body = await dmGet("/channels", { limit: "100", fields: "id,name,description" })
  const rows = dmRows(body)
  if (!rows.length) return "Dailymotion returned no channels."
  const lines = rows.map((row) => `${dmField(row, "id")} (${dmField(row, "name")})\n  ${dmField(row, "description")}`)
  return `Dailymotion's ${rows.length} channels. Pass one id to browse_channel:\n\n${lines.join("\n")}`
}
