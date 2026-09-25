export class OpenmojiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OpenmojiError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

interface Emoji { hexcode: string; emoji: string; annotation: string; group: string; subgroups: string; tags: string; }

let cache: Emoji[] | null = null;

async function data(): Promise<Emoji[]> {
  if (cache) return cache;
  let res: Response;
  try {
    res = await fetch("https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/data/openmoji.json", {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new OpenmojiError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) throw new OpenmojiError(`HTTP ${res.status}.`);
  cache = (await res.json()) as Emoji[];
  return cache;
}

const slim = (e: Emoji) => ({ hexcode: e.hexcode, emoji: e.emoji, annotation: e.annotation, group: e.group });

export async function searchEmoji(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  const q = query.toLowerCase();
  const all = await data();
  const hits = all.filter((e) => e.annotation.toLowerCase().includes(q) || e.tags.toLowerCase().includes(q) || e.group.toLowerCase().includes(q)).slice(0, n);
  return JSON.stringify(hits.map(slim), null, 2);
}

export async function getEmoji(hexcode: string): Promise<string> {
  const all = await data();
  const e = all.find((x) => x.hexcode.toUpperCase() === hexcode.toUpperCase());
  if (!e) throw new OpenmojiError(`Emoji not found: ${hexcode}.`);
  return JSON.stringify(e, null, 2).slice(0, 2000);
}

export async function listGroups(): Promise<string> {
  const all = await data();
  return JSON.stringify([...new Set(all.map((e) => e.group))], null, 2);
}

