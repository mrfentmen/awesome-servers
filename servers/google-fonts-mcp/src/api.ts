export class GFontsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GFontsError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

interface Fam { family: string; category: string; variants: string[]; subsets: string[]; version: string; lastModified: string; }

function key(): string {
  const k = process.env.GOOGLE_FONTS_KEY;
  if (!k) throw new GFontsError("Set GOOGLE_FONTS_KEY (free Google API key).");
  return k;
}

async function list(): Promise<Fam[]> {
  let res: Response;
  try {
    res = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${encodeURIComponent(key())}&sort=popularity`, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new GFontsError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new GFontsError(`HTTP ${res.status}: ${body}`);
  }
  const d = (await res.json()) as { items?: Fam[] };
  return d.items ?? [];
}

export async function listFonts(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  const items = await list();
  return JSON.stringify(items.slice(0, n).map((f) => ({ family: f.family, category: f.category, variants: f.variants })), null, 2);
}

export async function searchFonts(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  const q = query.toLowerCase();
  const items = await list();
  const hits = items.filter((f) => f.family.toLowerCase().includes(q)).slice(0, n);
  return JSON.stringify(hits.map((f) => ({ family: f.family, category: f.category, variants: f.variants })), null, 2);
}

export async function getFont(family: string): Promise<string> {
  const items = await list();
  const f = items.find((x) => x.family.toLowerCase() === family.toLowerCase());
  if (!f) throw new GFontsError(`Font not found: ${family}.`);
  return JSON.stringify(f, null, 2);
}

