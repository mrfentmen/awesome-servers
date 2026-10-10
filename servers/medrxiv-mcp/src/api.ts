const BASE = 'https://api.medrxiv.org/details/medrxiv';

export interface DetailsArgs {
  doi: string;
}

export interface RecentArgs {
  limit?: number;
}

export async function details(args: DetailsArgs): Promise<string> {
  const doi = (args.doi ?? '').trim();
  if (!doi) return 'Provide a medRxiv DOI.';
  const res = await fetch(`${BASE}/${encodeURIComponent(doi)}`, {
    headers: { 'User-Agent': 'mrfentmen-medrxiv-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`medRxiv returned ${res.status}`);
  const d = (await res.json()) as { collection?: Array<Record<string, unknown>> };
  const rows = d.collection ?? [];
  if (!rows.length) return `No medRxiv record for ${doi}.`;
  const r = rows[0];
  const s = (k: string) => (r[k] != null ? String(r[k]) : '');
  return [
    s('title') || `medRxiv ${doi}`,
    `Authors: ${s('authors').slice(0, 300)}`,
    `Posted: ${s('date')} | Version ${s('version')}`,
    `Category: ${s('category')}`,
  ].filter(Boolean).join('\n');
}

export async function recent(args: RecentArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const res = await fetch(`${BASE}/0/0/0/${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-medrxiv-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`medRxiv returned ${res.status}`);
  const d = (await res.json()) as { collection?: Array<Record<string, unknown>> };
  const rows = d.collection ?? [];
  if (!rows.length) return 'No medRxiv preprints returned.';
  return `Recent medRxiv preprints (${rows.length} shown):\n` +
    rows.map((r, i) => {
      const s = (k: string) => (r[k] != null ? String(r[k]) : '');
      return `${i + 1}. ${s('title')} | ${s('date')} | ${s('doi')}`;
    }).join('\n');
}

// ---- muxB tools:

const MED_DATE = /^\d{4}-\d{2}-\d{2}$/;

const medText = (row: Record<string, unknown>, key: string, fallback = 'not reported'): string => {
  const value = row[key];
  return value != null && String(value) !== '' ? String(value) : fallback;
};

interface MedPage {
  collection?: Array<Record<string, unknown>>;
  messages?: Array<{ total?: string | number; count_new_papers?: string | number; interval?: string }>;
}

/** Walks the medRxiv cursor so a window wider than one page is not silently truncated. */
async function medFetch(start: string, end: string, pages: number): Promise<{ rows: Array<Record<string, unknown>>; meta: MedPage['messages'] }> {
  const rows: Array<Record<string, unknown>> = [];
  let meta: MedPage['messages'];
  for (let page = 0; page < pages; page++) {
    const cursor = page * 30;
    const res = await fetch(`${BASE}/${start}/${end}/${cursor}`, {
      headers: { 'User-Agent': 'mrfentmen-medrxiv-mcp/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) throw new Error(`medRxiv returned ${res.status}`);
    const d = (await res.json()) as MedPage;
    meta = d.messages;
    const batch = d.collection ?? [];
    rows.push(...batch);
    if (batch.length < 30) break;
  }
  return { rows, meta };
}

function medWindow(args: { start?: string; end?: string }): { start: string; end: string } {
  const start = (args.start ?? '').trim();
  const end = (args.end ?? '').trim();
  if (!MED_DATE.test(start)) throw new Error('Provide start as YYYY-MM-DD.');
  if (!MED_DATE.test(end)) throw new Error('Provide end as YYYY-MM-DD.');
  if (start > end) throw new Error('start must not be after end.');
  return { start, end };
}

export interface PreprintsByDateArgs {
  start: string;
  end: string;
  limit?: number;
  pages?: number;
}

export interface CategoryBreakdownArgs {
  start: string;
  end: string;
  pages?: number;
}

export interface RevisedPreprintsArgs {
  start: string;
  end: string;
  limit?: number;
  pages?: number;
}

export async function revisedPreprints(args: RevisedPreprintsArgs): Promise<string> {
  const { start, end } = medWindow(args);
  const limit = Math.max(1, Math.min(args.limit ?? 15, 60));
  const pages = Math.max(1, Math.min(args.pages ?? 1, 4));
  const { rows } = await medFetch(start, end, pages);
  const revised = rows.filter((r) => Number(medText(r, 'version', '1')) > 1);
  if (!revised.length) return `No revised medRxiv preprints in the first ${rows.length} records posted between ${start} and ${end}. Widen pages to scan more.`;
  return `Revised medRxiv preprints ${start} to ${end} (${Math.min(revised.length, limit)} of ${revised.length} revisions in ${rows.length} scanned records):\n` +
    revised.slice(0, limit).map((r, i) => [
      `${i + 1}. ${medText(r, 'title')}`,
      `   v${medText(r, 'version')} posted ${medText(r, 'date')} | ${medText(r, 'category')} | doi ${medText(r, 'doi')}`,
      `   ${medText(r, 'authors').slice(0, 160)}`,
    ].join('\n')).join('\n');
}
