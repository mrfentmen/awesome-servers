
export interface m1_ListArgs {
  limit?: number;
}

const m0 = (() => {
const BASE = "https://picsum.photos"
const UA = "mrfentmen-placeholder-images-mcp/1.0 (https://github.com/mrfentmen)"
class PlaceholderError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, redirect: "follow", signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new PlaceholderError("picsum rate limit hit, wait and retry")
  if (!res.ok) throw new PlaceholderError(`picsum error ${res.status}`)
  return (await res.json()) as T
}

async function imageUrl(args: { width?: number; height?: number; seed?: string }): Promise<string> {
  const w = Math.min(Math.max(Math.round(args.width ?? 640), 10), 4000)
  const h = Math.min(Math.max(Math.round(args.height ?? 480), 10), 4000)
  const seed = (args.seed ?? "").trim()
  const path = seed ? `/seed/${encodeURIComponent(seed)}/${w}/${h}` : `/${w}/${h}`
  return `Placeholder image (${w}x${h}${seed ? `, seed ${seed}` : ""}):\n${BASE}${path}\n\nReal photo from the public picsum.photos collection. Use the URL directly in an img tag or download it.`
}

async function listImages(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 5, 30)
  const d = await get<any[]>(`${BASE}/v2/list?limit=${limit}`)
  if (!d.length) return "No images returned"
  return d.map((img: any, i: number) => `${i + 1}. id ${img?.id ?? "n/a"} | ${img?.width ?? "?"}x${img?.height ?? "?"} | ${img?.author ?? ""}\n   ${img?.download_url ?? ""}`).join("\n\n")
}

return { PlaceholderError, imageUrl, listImages };
})();

const m1 = (() => {
const BASE = 'https://picsum.photos/v2/list';

async function list(args: m1_ListArgs = {}): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
  const res = await fetch(`${BASE}?page=1&limit=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-picsum-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Picsum returned ${res.status}`);
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  if (!rows.length) return 'No Picsum photos available.';
  return `Picsum photos (${rows.length} shown):\n` +
    rows
      .map((p, i) => `${i + 1}. ${p.author ?? 'unknown'} | ${p.width ?? ''}x${p.height ?? ''} | ${p.download_url ?? ''}`)
      .join('\n');
}

return { list };
})();

export const PlaceholderError = m0.PlaceholderError;
export const imageUrl = m0.imageUrl;
export const list = m1.list;
export const listImages = m0.listImages;
export const m0_imageUrl = m0.imageUrl;
export const m0_listImages = m0.listImages;
export const m0_PlaceholderError = m0.PlaceholderError;
export const m1_list = m1.list;

// ---- muxC tools:

