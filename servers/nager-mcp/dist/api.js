/**
 * Nager.Date public holiday API client, keyless.
 * Covers 100+ countries: holidays, next holidays, long weekends.
 */
export class NagerError extends Error {
    constructor(message) {
        super(message);
        this.name = "NagerError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = "mrfentmen-nager-mcp/1.0";
const BASE = "https://date.nager.at/api/v3";
let countriesCache = null;
async function call(path) {
    let res;
    try {
        res = await fetch(BASE + path, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(20000),
        });
    }
    catch (e) {
        throw new NagerError(`Could not reach date.nager.at: ${errorMessage(e)}`);
    }
    const body = (await res.text()).slice(0, 200000);
    if (res.status === 204 || res.status === 404)
        return { status: res.status, body };
    if (!res.ok) {
        throw new NagerError(`date.nager.at returned HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    return { status: res.status, body };
}
async function getJson(path) {
    const { body } = await call(path);
    if (!body)
        throw new NagerError("date.nager.at returned an empty response.");
    try {
        return JSON.parse(body);
    }
    catch {
        throw new NagerError("date.nager.at returned a non-JSON response.");
    }
}
export async function countries() {
    if (countriesCache)
        return countriesCache;
    countriesCache = await getJson("/AvailableCountries");
    return countriesCache;
}
export async function countryInfo(country) {
    const code = normaliseCountry(country);
    return getJson(`/CountryInfo/${encodeURIComponent(code)}`);
}
export async function holidays(year, country) {
    const y = normaliseYear(year);
    const code = normaliseCountry(country);
    return getJson(`/PublicHolidays/${y}/${encodeURIComponent(code)}`);
}
export async function nextHolidays(country) {
    const code = normaliseCountry(country);
    return getJson(`/NextPublicHolidays/${encodeURIComponent(code)}`);
}
export async function worldwideHolidays() {
    return getJson("/NextPublicHolidaysWorldwide");
}
export async function longWeekends(year, country) {
    const y = normaliseYear(year);
    const code = normaliseCountry(country);
    return getJson(`/LongWeekend/${y}/${encodeURIComponent(code)}`);
}
export async function isTodayHoliday(country) {
    const code = normaliseCountry(country);
    const { status, body } = await call(`/IsTodayPublicHoliday/${encodeURIComponent(code)}`);
    if (status === 204)
        return { isHoliday: false };
    if (!body)
        return { isHoliday: false };
    try {
        const parsed = JSON.parse(body);
        const holiday = Array.isArray(parsed) ? parsed[0] : parsed;
        return holiday && holiday.name ? { isHoliday: true, holiday } : { isHoliday: false };
    }
    catch {
        return { isHoliday: false };
    }
}
function normaliseYear(year) {
    const y = year.trim();
    if (!/^\d{4}$/.test(y))
        throw new NagerError(`"${year}" is not a four-digit year.`);
    const n = Number(y);
    if (n < 1975 || n > 2100)
        throw new NagerError(`Year ${n} is outside the supported range 1975-2100.`);
    return y;
}
export function normaliseCountry(country) {
    const c = country.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(c)) {
        throw new NagerError(`"${country}" is not a two-letter country code - call list_countries for the list.`);
    }
    return c;
}
export function formatHoliday(h) {
    const types = (h.types ?? []).join("/");
    const scope = h.global === false ? "regional" : "national";
    return `  ${h.date}  ${h.localName}${h.name !== h.localName ? ` (${h.name})` : ""} - ${types || scope}`;
}
export function formatHolidays(list, title) {
    if (list.length === 0)
        return `No holidays found for ${title}.`;
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    return `${title} (${sorted.length}):\n\n${sorted.map(formatHoliday).join("\n")}`;
}
export function formatCountryInfo(info) {
    const borders = (info.borders ?? []).map((b) => `${b.commonName} (${b.countryCode})`);
    return [
        `${info.commonName} (${info.countryCode})`,
        `  official name  ${info.officialName}`,
        `  region         ${info.region}`,
        `  borders        ${borders.length ? borders.join(", ") : "none - island or no land border"}`,
    ].join("\n");
}
export function formatLongWeekends(list, title) {
    if (list.length === 0)
        return `No long weekends found for ${title}.`;
    const lines = list.map((w) => `  ${w.startDate} -> ${w.endDate}  ${w.dayCount} day(s)${w.needBridgeDay ? `  needs bridge day: ${(w.bridgeDays ?? []).join(", ")}` : "  no bridge day needed"}`);
    return `${title} (${list.length}):\n\n${lines.join("\n")}`;
}
// ---- batch-4 tools: regional holidays, date lookup and country diff (2026-09-27) ----
export async function regionalHolidays(year, country, county) {
    const y = normaliseYear(year);
    const code = normaliseCountry(country);
    const region = String(county ?? "").trim().toUpperCase();
    if (!/^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(region)) {
        throw new NagerError(`"${county}" is not a subdivision code - use the country code and the region, for example DE-BE or US-CA.`);
    }
    const list = await getJson(`/PublicHolidays/${y}/${encodeURIComponent(code)}?county=${encodeURIComponent(region)}`);
    if (!list.length)
        return `No holidays for ${code} in ${y}.`;
    const own = list.filter((h) => Array.isArray(h.counties) && h.counties.length > 0);
    const national = list.length - own.length;
    return [
        `Holidays that apply in ${region} during ${y}: ${list.length} in total`,
        `  national (country-wide): ${national} | ${region} specific: ${own.length}`,
        "",
        formatHolidays(list, `${region} ${y}`),
        "",
        "Subdivision codes follow ISO 3166-2: DE-BE (Berlin), US-CA (California), CA-ON (Ontario).",
    ].join("\n");
}
export async function holidayOnDate(date, country) {
    const clean = String(date ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        throw new NagerError(`"${date}" is not a date - use YYYY-MM-DD, for example 2026-12-25.`);
    }
    const year = clean.slice(0, 4);
    const code = normaliseCountry(country);
    const list = (await holidays(year, code)).sort((a, b) => a.date.localeCompare(b.date));
    const weekday = new Date(`${clean}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
    const hits = list.filter((h) => h.date === clean);
    const before = [...list].reverse().find((h) => h.date < clean);
    const after = list.find((h) => h.date > clean);
    const neighbours = [
        before ? `  previous  ${before.date}  ${before.localName}` : "",
        after ? `  next      ${after.date}  ${after.localName}` : "",
    ].filter(Boolean);
    if (!hits.length) {
        return [
            `${clean} (${weekday}) is not a public holiday in ${code}.`,
            "",
            ...neighbours,
            "",
            `The country has ${list.length} holiday(s) listed for ${year}.`,
        ].join("\n");
    }
    return [
        `Yes - ${clean} (${weekday}) is a public holiday in ${code}:`,
        "",
        ...hits.map((h) => `  ${h.localName}${h.name !== h.localName ? ` (${h.name})` : ""}${h.global === false ? " - subdivision only" : ""}`),
        hits.some((h) => !h.global) ? "  Some entries apply only in part of the country." : "",
        "",
        ...neighbours,
    ].filter((line) => line !== "").join("\n");
}
export async function compareCountries(year, countryA, countryB) {
    const y = normaliseYear(year);
    const a = normaliseCountry(countryA);
    const b = normaliseCountry(countryB);
    if (a === b)
        throw new NagerError("Give two different country codes to compare.");
    const [listA, listB] = await Promise.all([holidays(y, a), holidays(y, b)]);
    if (!listA.length || !listB.length) {
        throw new NagerError(`date.nager.at has no holidays for ${!listA.length ? a : b} in ${y}.`);
    }
    const namesA = new Set(listA.map((h) => `${h.date}|${h.name}`));
    const namesB = new Set(listB.map((h) => `${h.date}|${h.name}`));
    const shared = [...namesA].filter((key) => namesB.has(key)).sort();
    const onlyA = [...namesA].filter((key) => !namesB.has(key)).sort();
    const onlyB = [...namesB].filter((key) => !namesA.has(key)).sort();
    const datesA = new Map(listA.map((h) => [h.date, h.name]));
    const sameDateDifferentName = listB
        .filter((h) => datesA.has(h.date) && datesA.get(h.date) !== h.name)
        .map((h) => `  ${h.date}  ${h.name} vs ${datesA.get(h.date)}`);
    const show = (keys) => keys.slice(0, 12).map((key) => `  ${key.replace("|", "  ")}`);
    return [
        `${a} vs ${b} public holidays in ${y}:`,
        "",
        `  ${a}: ${listA.length} holiday(s) | ${b}: ${listB.length}`,
        `  same date and name: ${shared.length} | ${a} only: ${onlyA.length} | ${b} only: ${onlyB.length}`,
        `  same date, different name: ${sameDateDifferentName.length}`,
        "",
        "Shared days:",
        ...(shared.length ? show(shared) : ["  none"]),
        "",
        `Only in ${a}:`,
        ...(onlyA.length ? show(onlyA) : ["  none"]),
        "",
        `Only in ${b}:`,
        ...(onlyB.length ? show(onlyB) : ["  none"]),
        "",
        sameDateDifferentName.length ? "Same day, different name:" : "",
        ...sameDateDifferentName.slice(0, 8),
        "",
        `Shows up to 12 entries per list; both countries keep their own names for the same festival.`,
    ].filter((line) => line !== "").join("\n");
}
// ---- muxF tools:
const NAG_WEEKEND = [0, 6]; // getUTCDay: 0 Sunday, 6 Saturday
