const UA = 'mrfentmen-microlink-mcp/1.0';

export interface PreviewArgs {
  url: string;
}

export async function preview(args: PreviewArgs): Promise<string> {
  const url = (args.url ?? '').trim();
  if (!/^https?:\/\//i.test(url)) return 'Provide a full URL like https://github.com.';
  const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Microlink returned ${res.status}`);
  const d = (await res.json()) as { status?: string; data?: { title?: string; description?: string; url?: string; lang?: string; image?: { url?: string } } };
  const data = d.data;
  if (d.status !== 'success' || !data) throw new Error('Microlink: could not preview that URL');
  return [
    `Microlink preview for ${url}:`,
    `Title: ${data.title ?? '?'}`,
    `Description: ${data.description ?? 'n/a'}`,
    `Language: ${data.lang ?? '?'}`,
    data.image?.url ? `Image: ${data.image.url}` : null,
  ].filter(Boolean).join('\n');
}

// ---- muxB tools:

const ML_UA = 'mrfentmen-microlink-mcp/1.0'

interface MlResponse {
  status?: string
  statusCode?: number
  data?: {
    url?: string
    title?: string
    description?: string
    lang?: string
    author?: string
    image?: string
    logo?: string
    publisher?: string
    date?: string
    screenshot?: { url?: string; type?: string; width?: number; height?: number }
    iframe?: string
  }
  headers?: Record<string, string>
}

async function mlCall(params: URLSearchParams): Promise<MlResponse> {
  const res = await fetch(`https://api.microlink.io/?${params.toString()}`, {
    headers: { 'User-Agent': ML_UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(45000),
  })
  if (!res.ok) throw new Error(`Microlink API error ${res.status}`)
  return (await res.json()) as MlResponse
}

const mlField = (value: unknown, fallback = 'not reported'): string =>
  value != null && String(value) !== '' ? String(value) : fallback

export interface PageMetadataArgs {
  url: string;
}

export async function pageMetadata(args: PageMetadataArgs): Promise<string> {
  const url = (args.url ?? '').trim()
  if (!url) throw new Error('Provide a URL to inspect.')
  const d = await mlCall(new URLSearchParams({ url, meta: 'true' }))
  const meta = d.data ?? {}
  const title = meta.title ?? '(no title)'
  return [
    `Page metadata for ${url}`,
    `Status: ${mlField(d.status, 'unknown')}${d.statusCode != null ? ` (${d.statusCode})` : ''}`,
    `Title: ${title}`,
    `Description: ${mlField(meta.description).slice(0, 400)}`,
    `Language: ${mlField(meta.lang)}`,
    `Author: ${mlField(meta.author)}`,
    `Publisher: ${mlField(meta.publisher)}`,
    `Date: ${mlField(meta.date)}`,
    `Image: ${mlField(meta.image)}`,
    `Logo: ${mlField(meta.logo)}`,
  ].join('\n')
}

export interface PageScreenshotArgs {
  url: string;
  width?: number;
  mobile?: boolean;
}

