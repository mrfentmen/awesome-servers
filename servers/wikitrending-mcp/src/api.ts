const BASE = 'https://api.wikimedia.org/feed/v1/wikipedia/en';
const UA = 'mrfentmen-wikitrending-mcp/1.0 (test@example.com)';

function today(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}/${m}/${day}`;
}

function normDate(date?: string): string {
  const s = (date ?? '').trim();
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.replace(/-/g, '/');
  return today();
}

async function getFeed(date: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/featured/${date}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Wikimedia returned ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

export interface FeaturedArgs {
  date?: string;
}

export async function featured(args: FeaturedArgs): Promise<string> {
  const date = normDate(args?.date);
  const feed = await getFeed(date);
  const tfa = (feed.tfa ?? {}) as { title?: string; description?: string; extract?: string; content_urls?: { desktop?: { page?: string } } };
  if (!tfa.title) return `No featured article for ${date}.`;
  return [
    `Wikipedia featured article for ${date}:`,
    `Title: ${tfa.title}`,
    tfa.description ? `Description: ${tfa.description}` : null,
    tfa.extract ? `Extract: ${tfa.extract.slice(0, 400)}` : null,
    tfa.content_urls?.desktop?.page ? `Link: ${tfa.content_urls.desktop.page}` : null,
  ].filter(Boolean).join('\n');
}

export interface MostreadArgs {
  date?: string;
  limit?: number;
}

export async function mostread(args: MostreadArgs): Promise<string> {
  const date = normDate(args?.date);
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25);
  const feed = await getFeed(date);
  const mr = (feed.mostread ?? {}) as { articles?: Array<{ title?: string; views?: number; description?: string; normalizedtitle?: string }> };
  const articles = mr.articles ?? [];
  if (!articles.length) return `No most-read data for ${date}.`;
  const rows = articles.slice(0, limit).map((a, i) => `${i + 1}. ${a.normalizedtitle ?? a.title ?? '?'} (${a.views ?? '?'} views)`);
  return `Wikipedia most-read for ${date} (top ${rows.length}):\n${rows.join('\n')}`;
}

// ---- muxB tools:

export interface OnThisDayArgs {
  date?: string;
  limit?: number;
}

export async function onThisDay(args: OnThisDayArgs): Promise<string> {
  const date = normDate(args?.date);
  const limit = Math.max(1, Math.min(args?.limit ?? 10, 25));
  const feed = await getFeed(date);
  const items = (feed.onthisday ?? []) as Array<{ text?: string; pages?: Array<{ content_urls?: { desktop?: { page?: string } } }> }>;
  if (!items.length) return `No on-this-day entries in the Wikipedia feed for ${date}.`;
  return `Wikipedia on this day, ${date} (${Math.min(items.length, limit)} of ${items.length} shown):\n` +
    items.slice(0, limit).map((it, i) => {
      const link = it.pages?.[0]?.content_urls?.desktop?.page;
      return `${i + 1}. ${String(it.text ?? '').trim()}${link ? ` (${link})` : ''}`;
    }).join('\n');
}

export interface PictureOfTheDayArgs {
  date?: string;
}

// the feed sends description, artist, credit and licence as { text } or { html }
// objects, and image/thumbnail as { source }, so flatten whatever comes back
function picText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.replace(/<[^>]+>/g, '').trim();
  if (typeof value === 'object') {
    const row = value as Record<string, unknown>;
    const text = row.text ?? row.html ?? row.value ?? row.source;
    return text == null ? '' : picText(text);
  }
  return String(value).trim();
}

export async function pictureOfTheDay(args: PictureOfTheDayArgs): Promise<string> {
  const date = normDate(args?.date);
  const feed = await getFeed(date);
  const pic = (feed.image ?? {}) as Record<string, unknown>;
  const title = picText(pic.title);
  if (!title) return `No picture of the day in the Wikipedia feed for ${date}.`;
  const description = picText(pic.description);
  const artist = picText(pic.artist);
  const credit = picText(pic.credit);
  const licence = picText(pic.license);
  const image = picText(pic.image);
  const filePage = picText(pic.file_page);
  return [
    `Wikipedia picture of the day, ${date}:`,
    `Title: ${title}`,
    description ? `Description: ${description.slice(0, 400)}` : '',
    artist ? `Artist: ${artist.slice(0, 120)}` : '',
    licence ? `Licence: ${licence.slice(0, 80)}` : '',
    credit ? `Credit: ${credit.slice(0, 120)}` : '',
    image ? `Image: ${image}` : '',
    filePage ? `File page: ${filePage}` : '',
  ].filter((l) => l !== '').join('\n');
}
