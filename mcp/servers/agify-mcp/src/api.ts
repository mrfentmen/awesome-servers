const BASE = 'https://api.agify.io';

export interface AgeArgs {
  name: string;
}

export async function age(args: AgeArgs): Promise<string> {
  const name = (args.name ?? '').trim();
  if (!name) return 'Provide a first name.';
  const res = await fetch(`${BASE}?name=${encodeURIComponent(name)}`, {
    headers: { 'User-Agent': 'mrfentmen-agify-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Agify returned ${res.status}`);
  const data = (await res.json()) as { name?: string; age?: number | null; count?: number };
  if (typeof data.age !== 'number') return `No age estimate available for "${name}".`;
  return `${name}: estimated age ${data.age} (from ${data.count ?? 0} name records)`;
}

// ---- muxI tools:

const AGIFY = "https://api.agify.io";

function cap(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}

interface Estimate {
  name: string;
  age: number | null;
  count: number;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function estimate(name: string): Promise<Estimate> {
  const q = name.trim();
  // Agify answers 429 once its free quota is spent, so calls are spaced and
  // a 429 is retried after a pause instead of failing the whole tool.
  let res: Response | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await sleep(700);
    res = await fetch(`${AGIFY}?name=${encodeURIComponent(q)}`, {
      headers: { "User-Agent": "mrfentmen-agify-mcp/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status !== 429) break;
    await sleep(2000 * (attempt + 1));
  }
  if (!res) throw new Error(`Agify did not answer for "${q}".`);
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error(`Agify is rate limiting requests (429) after 4 attempts. The free endpoint allows only a small number of calls per day per address, so try again later.`);
    }
    throw new Error(`Agify returned ${res.status} for "${q}"`);
  }
  const d = (await res.json()) as { name?: string; age?: number | null; count?: number };
  return {
    name: String(d.name ?? q),
    age: typeof d.age === "number" ? d.age : null,
    count: Number(d.count ?? 0),
  };
}

function parseNames(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export interface RankArgs {
  names: string;
}

export interface FreqArgs {
  names: string;
}

export interface CorrArgs {
  names: string;
}

export async function ageVersusCommonality(args: CorrArgs): Promise<string> {
  const raw = (args.names ?? "").trim();
  if (!raw) throw new Error("Provide names separated by commas or newlines.");
  const names = parseNames(raw);
  if (names.length < 3) throw new Error("Provide at least three names so a relationship can be examined.");
  const rows: Estimate[] = [];
  for (const n of names) rows.push(await estimate(n));
  const usable = rows.filter((r) => r.age != null && r.count > 0);
  if (usable.length < 3) return `Not enough names with both an age and a record count to compare (${usable.length} usable).`;
  const ages = usable.map((r) => r.age as number);
  const counts = usable.map((r) => r.count);
  const n = usable.length;
  const meanA = ages.reduce((a, b) => a + b, 0) / n;
  const meanC = counts.reduce((a, b) => a + b, 0) / n;
  const cov = usable.reduce((a, r, i) => a + (ages[i] - meanA) * (counts[i] - meanC), 0);
  const sdA = Math.sqrt(usable.reduce((a, r, i) => a + (ages[i] - meanA) ** 2, 0));
  const sdC = Math.sqrt(usable.reduce((a, r, i) => a + (counts[i] - meanC) ** 2, 0));
  const r = sdA > 0 && sdC > 0 ? cov / (sdA * sdC) : 0;
  const ranked = [...usable].sort((a, b) => (b.count as number) - (a.count as number));
  return [
    `Age against commonality across ${n} name(s) from Agify:`,
    ...ranked.map((x, i) => `${i + 1}. ${x.name} | age ${x.age} | ${x.count.toLocaleString("en-US")} records`),
    `Pearson correlation between estimated age and record count: r = ${r.toFixed(3)}`,
    `A positive r means the more common names in this set skew younger, which is the usual pattern when a cohort of names is large enough to include many children.`,
    "With a handful of names this is an illustration, not a statistic: the correlation is only meaningful over a large, randomly chosen name set.",
  ].join("\n");
}
