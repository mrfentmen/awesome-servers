const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const res = await fetch(`${BASE}/esearch.fcgi?db=clinvar&term=${encodeURIComponent(query)}&retmode=json&retmax=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-clinvar-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`ClinVar returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const er = (d.esearchresult ?? {}) as Record<string, unknown>;
  const ids = (er.idlist ?? []) as Array<unknown>;
  const count = String(er.count ?? '0');
  if (!ids.length) return `No ClinVar records for "${query}".`;
  return `ClinVar records for "${query}" (${ids.length} shown of ${count}):\n` +
    ids.map((id, i) => `${i + 1}. VCV${String(id)}`).join('\n');
}

// ---- muxA tools:

const EU = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

function cap(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function ncbiGet(path: string): Promise<any> {
  // NCBI allows 3 requests a second without an api key and answers 429 above that,
  // so every call is spaced out and a 429 is retried after a pause.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await sleep(400);
    const res = await fetch(`${EU}/${path}`, {
      headers: { "User-Agent": "mrfentmen-clinvar-mcp/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
    if (res.status === 429) {
      await sleep(1200 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`ClinVar returned ${res.status}`);
    return (await res.json()) as any;
  }
  throw new Error("ClinVar kept answering 429 rate limit after 4 attempts. Wait a moment and try again.");
}

export interface SummaryArgs {
  id: string;
}

export interface CompareArgs {
  queries: string;
}

export interface QueryInfoArgs {
  query: string;
  limit?: number;
}

export async function queryInfo(args: QueryInfoArgs): Promise<string> {
  const q = (args.query ?? "").trim();
  if (!q) throw new Error("Provide a search term.");
  const limit = cap(args.limit, 10, 50);
  const d = await ncbiGet(`esearch.fcgi?db=clinvar&term=${encodeURIComponent(q)}&retmode=json&retmax=${limit}`);
  const er = (d.esearchresult ?? {}) as Record<string, any>;
  const stack = (er.translationstack ?? []) as Array<Record<string, any>>;
  const sets = (er.translationset ?? []) as Array<Record<string, any>>;
  const ids = (er.idlist ?? []) as string[];
  if (!ids.length) return `ClinVar has no records for "${q}". ${er.errorlist ? `Reported problems: ${JSON.stringify(er.errorlist)}` : ""}`.trim();
  return [
    `ClinVar search for "${q}": ${Number(er.count ?? 0).toLocaleString("en-US")} record(s), returning ${ids.length}.`,
    `NCBI query translation: ${String(er.querytranslation ?? "not reported")}`,
    stack.length ? `Translation stack: ${stack.map((s) => `${String(s.field ?? "?")}:${s.term ?? "?"}${s.join ? " (joined)" : ""}`).join(" then ")}` : "",
    sets.length ? `Translation sets: ${sets.map((s) => s.term).filter(Boolean).join(" | ")}` : "",
    `First ids: ${ids.map((i) => `VCV${i}`).join(", ")}`,
    er.warninglist ? `Warnings: ${JSON.stringify(er.warninglist).slice(0, 300)}` : "",
    "Use the numeric part of any id with the variant_summary tool to get the full clinical record.",
  ]
    .filter((l) => l !== "")
    .join("\n");
}
