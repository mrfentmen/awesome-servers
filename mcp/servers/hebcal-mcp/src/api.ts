const UA = 'mrfentmen-hebcal-mcp/1.0';

export interface ConvertArgs {
  date: string;
}

export async function convert(args: ConvertArgs): Promise<string> {
  const date = (args.date ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Provide a date as YYYY-MM-DD.';
  const res = await fetch(`https://www.hebcal.com/converter?cfg=json&date=${encodeURIComponent(date)}&g2h=1`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Hebcal returned ${res.status}`);
  const d = (await res.json()) as { gy?: number; gm?: number; gd?: number; hy?: number; hm?: string; hd?: number; hebrew?: string; events?: string[] };
  return [
    `Hebcal conversion for ${date}:`,
    `Hebrew date: ${d.hd ?? '?'} ${d.hm ?? '?'} ${d.hy ?? '?'} (${d.hebrew ?? '?'})`,
    d.events?.length ? `Events: ${(d.events ?? []).slice(0, 5).join(' | ')}` : null,
  ].filter(Boolean).join('\n');
}

// ---- muxC tools:

interface HebcalItem {
  title?: string
  date?: string
  hdate?: string
  category?: string
  subcat?: string
  hebrew?: string
  leyning?: Record<string, string>
}

interface HebcalCalendar {
  title?: string
  range?: { start?: string; end?: string }
  items?: HebcalItem[]
}

