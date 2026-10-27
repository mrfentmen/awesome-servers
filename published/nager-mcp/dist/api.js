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
/**
 * The holiday API answers "when are the holidays"; these two answer the
 * questions a working calendar actually needs - how many working days are
 * left, and where a holiday lands on a weekend.
 */
const NAG_WEEKEND = [0, 6]; // getUTCDay: 0 Sunday, 6 Saturday
const nagDayName = (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
const nagIsWeekend = (date) => NAG_WEEKEND.includes(new Date(`${date}T00:00:00Z`).getUTCDay());
const nagAddDays = (date, days) => {
    const stamp = Date.parse(`${date}T00:00:00Z`);
    return new Date(stamp + days * 86_400_000).toISOString().slice(0, 10);
};
const nagMonthName = (month) => new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
async function nagYear(code, year) {
    const list = await getJson(`/PublicHolidays/${year}/${code}`);
    return (Array.isArray(list) ? list : []).filter((h) => h && typeof h.date === "string");
}
/** Month by month working-day arithmetic for one country and year. */
export async function workingDayCalendar(args) {
    const code = normaliseCountry(args?.country);
    const year = normaliseYear(args?.year);
    const holidays = await nagYear(code, year);
    const holidayDays = new Set(holidays.map((h) => h.date));
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    const months = [];
    let totalWeekdays = 0;
    let totalWeekends = 0;
    let totalHolidays = 0;
    let totalWorking = 0;
    for (let month = 1; month <= 12; month += 1) {
        const key = `${year}-${String(month).padStart(2, "0")}`;
        const daysInMonth = new Date(Date.UTC(Number(year), month, 0)).getUTCDate();
        let weekends = 0;
        let holidays = 0;
        let weekdayHolidays = 0;
        let workingInMonth = 0;
        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = `${key}-${String(day).padStart(2, "0")}`;
            const weekend = nagIsWeekend(date);
            const isHoliday = holidayDays.has(date);
            if (weekend)
                weekends += 1;
            if (isHoliday) {
                holidays += 1;
                if (!weekend)
                    weekdayHolidays += 1;
            }
            if (!weekend && !isHoliday)
                workingInMonth += 1;
        }
        const weekdays = daysInMonth - weekends;
        const working = weekdays - weekdayHolidays;
        totalWorking += working;
        months.push({ month: key, days: daysInMonth, weekends, weekdays, holidays, working });
        totalWeekends += weekends;
        totalHolidays += holidays;
        totalWeekdays += weekdays;
    }
    const longestStreak = () => {
        let best = { from: "", to: "", days: 0 };
        let run = 0;
        let start = "";
        for (let day = 1; day <= 366; day += 1) {
            const date = nagAddDays(yearStart, day - 1);
            if (date > yearEnd)
                break;
            const free = !nagIsWeekend(date) && !holidayDays.has(date);
            if (free) {
                if (run === 0)
                    start = date;
                run += 1;
                if (run > best.days)
                    best = { from: start, to: date, days: run };
            }
            else {
                run = 0;
            }
        }
        return best;
    };
    const streak = longestStreak();
    const lines = [
        `Working-day calendar for ${code} in ${year}, from the holiday API's own list (${holidays.length} holiday date(s))`,
        `  ${totalWeekdays} weekday(s) in the year, ${totalWeekends} weekend day(s), ${totalHolidays} of those weekdays are holidays`,
        `  working days: ${totalWorking}`,
        `  longest unbroken run of working days: ${streak.days} day(s), ${streak.from} to ${streak.to}`,
        "",
        "  month          days  weekends  weekdays  holidays  working",
    ];
    for (const m of months) {
        lines.push(`  ${nagMonthName(m.month).padEnd(14)}${String(m.days).padStart(4)}${String(m.weekends).padStart(10)}${String(m.weekdays).padStart(10)}${String(m.holidays).padStart(10)}${String(m.working).padStart(9)}`);
    }
    lines.push("");
    lines.push("  A holiday that falls on a weekend costs no working day, which is why a country's working-day count is lower than its weekday count by less than its holiday count.");
    return lines.join("\n");
}
/** Where each holiday lands, and what it does to the working week around it. */
export async function holidayObservanceAudit(args) {
    const code = normaliseCountry(args?.country);
    const year = normaliseYear(args?.year);
    const holidays = await nagYear(code, year);
    if (!holidays.length)
        throw new NagerError(`The holiday API has no ${year} holidays for ${code}.`);
    const rows = [...holidays].sort((a, b) => a.date.localeCompare(b.date));
    const weekendRows = rows.filter((h) => nagIsWeekend(h.date));
    const mondayObserved = rows.filter((h) => nagIsWeekend(h.date) && nagDayName(h.date) === "Sun");
    const saturdayRows = rows.filter((h) => nagDayName(h.date) === "Sat");
    const national = rows.filter((h) => h.global !== false);
    const regional = rows.filter((h) => h.global === false);
    const runAfter = (date) => {
        let count = 0;
        let cursor = date;
        for (let i = 0; i < 14; i += 1) {
            cursor = nagAddDays(cursor, 1);
            const weekend = nagIsWeekend(cursor);
            if (!weekend && !rows.some((h) => h.date === cursor))
                count += 1;
        }
        return count;
    };
    const lines = [
        `Holiday observance for ${code} in ${year}: ${rows.length} holiday date(s)`,
        `  ${national.length} national, ${regional.length} regional (${regional.length ? "regional holidays may not apply where you are" : "none reported"})`,
        `  ${weekendRows.length} fall on a weekend: ${saturdayRows.length} Saturday, ${mondayObserved.length} Sunday`,
    ];
    lines.push("");
    lines.push("  date        day   falls on   gap to next free working day   name");
    for (const h of rows) {
        const day = nagDayName(h.date);
        const weekend = nagIsWeekend(h.date);
        const gap = weekend ? "weekend, no working day lost" : `${runAfter(h.date)} working day(s) after`;
        lines.push(`  ${h.date}  ${day.padEnd(5)} ${(weekend ? "weekend" : "weekday").padEnd(10)} ${gap.padEnd(32)} ${h.localName || h.name}`);
    }
    lines.push("");
    if (weekendRows.length) {
        lines.push(`  ${weekendRows.length} holiday(s) land on a weekend, so a substitute day is the employer's policy, not something the API states.`);
    }
    const backToBack = rows.filter((h, i) => i > 0 && nagAddDays(rows[i - 1].date, 1) === h.date);
    if (backToBack.length) {
        lines.push(`  ${backToBack.length} holiday(s) fall on the day after another: ${backToBack.map((h) => `${h.date} ${h.localName}`).join(", ")}`);
    }
    return lines.join("\n");
}
