
export interface m1_RandomArgs {
  limit?: number;
}

const m0 = (() => {
const BASE = "https://commons.wikimedia.org/w/api.php"
const UA = "mrfentmen-wikimedia-commons-mcp/1.0 (https://github.com/mrfentmen)"
class CommonsError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new CommonsError(`Wikimedia Commons returned HTTP ${res.status}`)
  return (await res.json()) as T
}

function pagesFrom(d: any): any[] {
  const pages = d?.query?.pages ?? {}
  return Object.values(pages) as any[]
}

async function search(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new CommonsError("Provide a search query")
  const limit = Math.min(args.limit ?? 8, 20)
  const d = await get<any>(
    `${BASE}?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}&gsrlimit=${limit}&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`
  )
  const pages = pagesFrom(d)
  if (!pages.length) return `No Commons files found for \"${q}\"`
  return `Commons files for \"${q}\":\n` + pages.map((p: any, i: number) => {
    const info = p?.imageinfo?.[0] ?? {}
    const size = info?.width && info?.height ? `${info.width}x${info.height}` : ""
    const bytes = info?.size != null ? `${(info.size / 1024).toFixed(0)} KB` : ""
    return `${i + 1}. ${p?.title ?? "n/a"}\n   ${info?.url ?? ""} ${size ? `| ${size}` : ""} ${bytes ? `| ${bytes}` : ""}`
  }).join("\n")
}

async function file(args: { title?: string }): Promise<string> {
  const title = (args.title ?? "").trim()
  if (!title) throw new CommonsError("Provide a file title like File:Example.jpg")
  const d = await get<any>(
    `${BASE}?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|size|mime|extmetadata&format=json&origin=*`
  )
  const p = pagesFrom(d)[0]
  const info = p?.imageinfo?.[0]
  if (!info) throw new CommonsError(`File not found: ${title}`)
  const meta = info?.extmetadata ?? {}
  const artist = (meta?.Artist?.value ?? "").replace(/<[^>]+>/g, "").slice(0, 120)
  const license = (meta?.LicenseShortName?.value ?? "").replace(/<[^>]+>/g, "")
  const lines = [
    `Title: ${p?.title ?? title}`,
    `URL: ${info?.url ?? ""}`,
    `Size: ${info?.width ?? "?"}x${info?.height ?? "?"} | ${info?.mime ?? ""} | ${info?.size != null ? `${(info.size / 1024 / 1024).toFixed(1)} MB` : ""}`,
  ]
  if (artist) lines.push(`Artist: ${artist}`)
  if (license) lines.push(`License: ${license}`)
  return lines.join("\n")
}

return { CommonsError, file, search };
})();

const m1 = (() => {
const BASE = 'https://commons.wikimedia.org/w/api.php';

async function random(args: m1_RandomArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 5, 15));
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'random',
    grnnamespace: '6',
    grnlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
  });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-wikimedia-feed-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Wikimedia Commons returned ${res.status}`);
  const data = (await res.json()) as { query?: { pages?: Record<string, unknown> } };
  const pages = data.query?.pages ?? {};
  const items = Object.values(pages).map((p) => {
    const rec = p as Record<string, unknown>;
    const info = Array.isArray(rec.imageinfo) ? (rec.imageinfo[0] as Record<string, unknown>) : {};
    const meta = (info.extmetadata as Record<string, unknown>) ?? {};
    const title = (meta.ImageDescription as Record<string, unknown>)?.value ?? rec.title ?? '';
    const artist = (meta.Artist as Record<string, unknown>)?.value ?? '';
    const clean = String(title).replace(/<[^>]*>/g, '').trim();
    const by = String(artist).replace(/<[^>]*>/g, '').trim();
    return `${clean}${by ? ` by ${by}` : ''}${info.descriptionurl ? `\n   ${info.descriptionurl}` : ''}`;
  });
  if (!items.length) return 'No random images returned.';
  return `Random Wikimedia Commons images (${items.length} shown):\n` + items.map((s, i) => `${i + 1}. ${s}`).join('\n');
}

return { random };
})();

export const CommonsError = m0.CommonsError;
export const file = m0.file;
export const random = m1.random;
export const search = m0.search;
export const m0_file = m0.file;
export const m0_search = m0.search;
export const m0_CommonsError = m0.CommonsError;
export const m1_random = m1.random;

// ---- muxC tools:

const COMMONS_BASE = "https://commons.wikimedia.org/w/api.php"
const COMMONS_UA = "mrfentmen-wikimedia-commons-mcp/1.0 (https://github.com/mrfentmen)"

class CommonsLookupError extends Error {}

async function commonsGet(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": COMMONS_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new CommonsLookupError(`Wikimedia Commons returned HTTP ${res.status}`)
  return res.json()
}

/** Browse a Commons category and list the media files inside it. */
export async function categoryFiles(args: { category?: string; limit?: number }): Promise<string> {
  const raw = (args.category ?? "").trim()
  if (!raw) throw new CommonsLookupError("Provide a category name, e.g. Featured pictures of animals")
  const category = raw.startsWith("Category:") ? raw : `Category:${raw}`
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50))
  const d = await commonsGet(
    `${COMMONS_BASE}?action=query&list=categorymembers&cmtitle=${encodeURIComponent(category)}&cmtype=file|subcat&cmlimit=${limit}&format=json&origin=*`,
  )
  const rows = d?.query?.categorymembers ?? []
  if (!rows.length) return `Commons category ${category} has no file or subcategory members.`
  return `Members of ${category} (${rows.length} shown):\n` +
    rows.map((m: any, i: number) => `${i + 1}. ${m.title} (${m.ns === 14 ? "subcategory" : "file"})`).join("\n")
}
