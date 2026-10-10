
export interface m1_HolidaysArgs {
  country: string;
  year: number;
}

const m0 = (() => {
const NAGER_BASE = 'https://date.nager.at/api/v3';
const OPEN_BASE = 'https://openholidaysapi.org';
const UA = 'mrfentmen-holidays-mcp/1.0 (https://github.com/mrfentmen)';
class HolidaysError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new HolidaysError(`Holidays API error ${res.status}`);
  return (await res.json()) as T;
}

async function publicHolidays(args: { year?: number; country?: string }): Promise<string> {
  const year = args.year ?? new Date().getFullYear();
  const country = (args.country ?? 'US').toUpperCase();
  const rows = await get<any[]>(`${NAGER_BASE}/PublicHolidays/${year}/${country}`);
  return rows.map((h: any) =>
    `${h.date ?? ''} | ${h.localName ?? h.name ?? ''}${h.global ? ' (nationwide)' : ''}`
  ).join('\n') || 'No holidays found';
}

async function nextHolidays(args: { country?: string; limit?: number }): Promise<string> {
  const country = (args.country ?? 'US').toUpperCase();
  const limit = Math.min(args.limit ?? 8, 20);
  const rows = await get<any[]>(`${NAGER_BASE}/NextPublicHolidays/${country}`);
  return rows.slice(0, limit).map((h: any) =>
    `${h.date ?? ''} | ${h.localName ?? h.name ?? ''}`
  ).join('\n') || 'No upcoming holidays found';
}

async function countries(_args: Record<string, never> = {}): Promise<string> {
  const d = await get<Array<{ isoCode?: string; name?: Array<{ language?: string; text?: string }> }>>(`${OPEN_BASE}/Countries?languageIsoCode=EN`);
  if (!Array.isArray(d) || !d.length) return 'No countries returned.';
  const name = (c: { isoCode?: string; name?: Array<{ text?: string }> }) => c.name?.find((n) => n.text)?.text ?? c.isoCode ?? '?';
  return `Open Holidays countries (${d.length}):\n` + d.slice(0, 50).map((c, i) => `${i + 1}. ${name(c)} (${c.isoCode ?? '?'})`).join('\n');
}

async function openHolidays(args: { country?: string; year?: number }): Promise<string> {
  const country = (args.country ?? '').trim().toUpperCase();
  const year = Number(args.year ?? new Date().getFullYear());
  if (!country || !Number.isFinite(year)) return 'Provide country (ISO) and year.';
  const url = `${OPEN_BASE}/PublicHolidays?countryIsoCode=${encodeURIComponent(country)}&languageIsoCode=EN&validFrom=${year}-01-01&validTo=${year}-12-31`;
  const d = await get<Array<{ startDate?: string; endDate?: string; name?: Array<{ text?: string }>; type?: string }>>(url);
  if (!Array.isArray(d) || !d.length) return `No holidays for ${country} in ${year}.`;
  return `Open Holidays for ${country} in ${year} (${d.length}):\n` +
    d.map((h, i) => `${i + 1}. ${h.startDate ?? '?'}${h.endDate && h.endDate !== h.startDate ? ` to ${h.endDate}` : ''}: ${h.name?.find((n) => n.text)?.text ?? '?'} (${h.type ?? '?'})`).join('\n');
}

return { HolidaysError, countries, nextHolidays, openHolidays, publicHolidays };
})();

const m1 = (() => {
const BASE = 'https://date.nager.at/api/v3/PublicHolidays';


async function holidays(args: m1_HolidaysArgs): Promise<string> {
  const country = (args.country ?? '').trim().toUpperCase();
  const year = Math.max(2000, Math.min(Math.floor(args.year ?? 0), 2100));
  if (!country || !year) return 'Provide a country code and year.';
  const res = await fetch(`${BASE}/${year}/${encodeURIComponent(country)}`, {
    headers: { 'User-Agent': 'mrfentmen-nager-date-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Nager.Date returned ${res.status}`);
  const d = (await res.json()) as Array<Record<string, unknown>>;
  if (!d.length) return `No holidays for ${country} ${year}.`;
  return `Public holidays ${country} ${year} (${d.length}):\n` +
    d.slice(0, 20).map((r, i) => {
      const s = (k: string) => (r[k] != null ? String(r[k]) : '');
      return `${i + 1}. ${s('date')} | ${s('localName')}${s('name') !== s('localName') ? ` (${s('name')})` : ''}`;
    }).join('\n');
}

return { holidays };
})();

export const HolidaysError = m0.HolidaysError;
export const countries = m0.countries;
export const holidays = m1.holidays;
export const nextHolidays = m0.nextHolidays;
export const openHolidays = m0.openHolidays;
export const publicHolidays = m0.publicHolidays;
export const m0_nextHolidays = m0.nextHolidays;
export const m0_HolidaysError = m0.HolidaysError;
export const m0_countries = m0.countries;
export const m0_publicHolidays = m0.publicHolidays;
export const m0_openHolidays = m0.openHolidays;
export const m1_holidays = m1.holidays;

// ---- muxC tools:

const NAGER_COUNTRIES = "https://date.nager.at/api/v3/AvailableCountries"
const HOLIDAYS_UA = "mrfentmen-holidays-mcp/1.0 (https://github.com/mrfentmen)"

class CountryListError extends Error {}

/**
 * Both backends only accept a two-letter code, and neither will tell you what
 * they accept, so this lists the codes the Nager backend actually serves.
 */
export async function availableCountries(args: { search?: string }): Promise<string> {
  const q = (args.search ?? "").trim().toLowerCase()
  const res = await fetch(NAGER_COUNTRIES, {
    headers: { "User-Agent": HOLIDAYS_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new CountryListError(`Nager.at country list returned ${res.status}`)
  const all = (await res.json()) as Array<{ countryCode?: string; name?: string }>
  const list = Array.isArray(all) ? all : []
  if (!list.length) throw new CountryListError("Nager.at returned an empty country list")
  const hits = q ? list.filter((c) => String(c.name ?? "").toLowerCase().includes(q) || String(c.countryCode ?? "").toLowerCase() === q) : list
  if (!hits.length) return `Nager.at has no country matching "${q}".`
  const shown = hits.slice(0, 120)
  return [
    `Country codes the holidays API accepts (${hits.length}${hits.length > shown.length ? `, showing ${shown.length}` : ""}):`,
    shown.map((c) => `${c.countryCode ?? "?"} - ${c.name ?? "name not reported"}`).join("\n"),
  ].join("\n")
}
