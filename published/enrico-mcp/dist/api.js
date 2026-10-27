const UA = 'mrfentmen-enrico-mcp/1.0';
const BASE = 'https://kayaposoft.com/enrico/json/v2.0';
export async function countries() {
    const res = await fetch(`${BASE}/?action=getSupportedCountries`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Enrico returned ${res.status}`);
    const d = (await res.json());
    if (!Array.isArray(d) || !d.length)
        return 'No countries returned.';
    return `Enrico supported countries (${d.length}):\n` + d.slice(0, 30).map((c) => `* ${c.countryCode ?? '?'} - ${c.fullName ?? '?'}`).join('\n');
}
export async function holidays(args) {
    const country = String(args.country).trim();
    const year = Math.min(Math.max(Number(args.year) || 2026, 2000), 2100);
    const res = await fetch(`${BASE}/?action=getHolidaysForYear&year=${year}&country=${encodeURIComponent(country)}&holidayType=public_holiday`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Enrico returned ${res.status}`);
    const d = (await res.json());
    if (!Array.isArray(d) || !d.length)
        return `No holidays for ${country} in ${year}.`;
    return `Public holidays for ${country.toUpperCase()} ${year} (${d.length}):\n` + d.slice(0, 25).map((h) => {
        const date = h.date ? `${h.date.year}-${String(h.date.month).padStart(2, '0')}-${String(h.date.day).padStart(2, '0')}` : '?';
        return `* ${date}: ${h.name?.[0]?.text ?? '?'}`;
    }).join('\n');
}
// ---- muxE tools:
// The two existing tools print a country's code and name, or one year of its
// public holidays. The new ones use the parts of the payload neither reads: the
// coverage window and holiday type list every country record carries, and the
// non public holiday types the service also serves per country.
const ENRICO = "https://kayaposoft.com/enrico/json/v2.0";
const ENRICO_UA = "mrfentmen-enrico-mcp/1.0";
async function enricoJson(params) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${ENRICO}/?${qs}`, {
        headers: { "User-Agent": ENRICO_UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new Error(`Enrico returned ${res.status}`);
    const raw = await res.text();
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        throw new Error("Enrico returned a body that is not JSON.");
    }
    if (parsed && typeof parsed.error === "string")
        throw new Error(`Enrico said: ${parsed.error}`);
    return parsed;
}
const isoDate = (d) => {
    if (!d || typeof d.year !== "number")
        return "not reported";
    // 52 of the 60 country records carry 32767 as a placeholder end year, verified
    // live, so a real date is not printed for it
    if (d.year >= 30000)
        return "open ended, the record carries a placeholder year";
    return `${d.year}-${String(d.month ?? 1).padStart(2, "0")}-${String(d.day ?? 1).padStart(2, "0")}`;
};
/** the name array is localised, so pick English when the service offers it */
const localised = (names) => {
    if (!Array.isArray(names) || !names.length)
        return "name not reported";
    const english = names.find((n) => String(n?.lang ?? "").toLowerCase().startsWith("en"));
    if (english?.text)
        return english.text;
    const first = names.find((n) => n?.text);
    const others = names.length - 1;
    return `${first?.text ?? "name not reported"}${others > 0 ? ` (only ${names.length} translation${names.length === 1 ? "" : "s"}; ${names.map((n) => n?.lang ?? "?").join(", ")})` : ""}`;
};
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export async function countryCoverage(_args = {}) {
    const list = await enricoJson({ action: "getSupportedCountries" });
    const countries = Array.isArray(list) ? list : [];
    if (!countries.length)
        throw new Error("Enrico returned no countries.");
    const typeCount = new Map();
    for (const c of countries) {
        for (const t of c.holidayTypes ?? [])
            typeCount.set(t, (typeCount.get(t) ?? 0) + 1);
    }
    const fromYears = countries
        .map((c) => c.fromDate?.year)
        .filter((y) => typeof y === "number");
    const bounded = countries.filter((c) => typeof c.toDate?.year === "number" && c.toDate.year < 30000);
    const withRegions = countries.filter((c) => Array.isArray(c.regions) && c.regions.length > 0);
    const lines = [
        `What the Enrico holiday service actually covers, across its ${countries.length} countries:`,
        `  every country offers: ${[...typeCount.entries()].filter(([, n]) => n === countries.length).map(([t]) => t).join(", ") || "none of them"}`,
        `  distinct holiday types in the catalogue: ${typeCount.size}`,
    ];
    for (const [type, n] of [...typeCount.entries()].sort((a, b) => b[1] - a[1])) {
        const names = countries.filter((c) => (c.holidayTypes ?? []).includes(type)).map((c) => (c.countryCode ?? "?").toUpperCase());
        const shown = names.slice(0, 12).join(", ");
        lines.push(`    ${type}: ${n} of ${countries.length} countries${names.length ? ` (${shown}${names.length > 12 ? `, and ${names.length - 12} more` : ""})` : ""}`);
    }
    lines.push(`  countries that publish a start year: ${fromYears.length}, earliest ${fromYears.length ? Math.min(...fromYears) : "not reported"}, latest ${fromYears.length ? Math.max(...fromYears) : "not reported"}`);
    lines.push(`  countries whose records stop: ${bounded.length ? `${bounded.length} name a real end year (${[...new Set(bounded.map((c) => c.toDate?.year))].sort((a, b) => (a ?? 0) - (b ?? 0)).join(", ")}), the other ${countries.length - bounded.length} carry a placeholder end year` : `none name a real end year, all ${countries.length} carry a placeholder`}`);
    lines.push(`  countries split into regions: ${withRegions.length}`);
    for (const c of withRegions.slice(0, 8)) {
        lines.push(`    ${(c.countryCode ?? "?").toUpperCase()} ${c.fullName ?? ""}: ${(c.regions ?? []).length} region code(s) - ${(c.regions ?? []).join(", ")}`);
    }
    if (withRegions.length > 8)
        lines.push(`    and ${withRegions.length - 8} more region-split countries`);
    const longest = [...countries].sort((a, b) => (b.holidayTypes ?? []).length - (a.holidayTypes ?? []).length)[0];
    lines.push(`  richest country record: ${(longest.countryCode ?? "?").toUpperCase()} ${longest.fullName ?? ""} with ${(longest.holidayTypes ?? []).length} holiday types, covering ${isoDate(longest.fromDate)} to ${isoDate(longest.toDate)}`);
    lines.push("  the countries tool prints only the code and the name and stops at 30 of them, so none of this is visible there.");
    return lines.join("\n");
}

const HOLIDAY_TYPES = ['public_holiday', 'observance', 'other_day', 'extra_working_day', 'school_holiday', 'postal_holiday'];
const ENRICO_BASE = 'https://kayaposoft.com/enrico/json/v2.0';
async function enrico(action, params) {
    const qs = new URLSearchParams({ action, ...params });
    const res = await fetch(`${ENRICO_BASE}/?${qs}`, {
        headers: { 'User-Agent': 'mrfentmen-enrico-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Enrico returned ${res.status}`);
    const d = (await res.json());
    if (d && !Array.isArray(d) && d.error)
        throw new Error(`Enrico error: ${d.error}`);
    return d;
}
export async function countryCalendar(args = {}) {
    const country = String(args?.country ?? '').trim().toLowerCase();
    if (!/^[a-z]{3}$/.test(country))
        throw new Error('Use a three letter country code like USA or DEU.');
    const year = Number(args?.year);
    if (!Number.isInteger(year) || year < 1940 || year > 2100)
        throw new Error('Year must be a whole number between 1940 and 2100.');
    const countries = await enrico('getSupportedCountries', {});
    const info = (Array.isArray(countries) ? countries : []).find((c) => String(c.countryCode).toLowerCase() === country);
    if (!info)
        throw new Error(`Enrico has no data for "${args?.country}".`);
    const types = (info.holidayTypes ?? []).filter((t) => HOLIDAY_TYPES.includes(t));
    const days = [];
    for (const type of types) {
        const rows = await enrico('getHolidaysForYear', { year: String(year), country: info.countryCode, holidayType: type });
        for (const row of Array.isArray(rows) ? rows : []) {
            const en = (row.name ?? []).find((n) => n.lang === 'en') ?? row.name?.[0];
            days.push({
                date: row.date,
                text: en?.text ?? '(unnamed)',
                type: row.holidayType ?? type,
            });
        }
    }
    const from = info.fromDate ? `${info.fromDate.year}` : '?';
    const to = info.toDate && info.toDate.year < 9999 ? `${info.toDate.year}` : 'open ended';
    const regions = (info.regions ?? []).length ? info.regions.join(', ') : 'whole country';
    const header = `${info.fullName ?? country.toUpperCase()} — ${year}`;
    const coverage = `Coverage: ${from} to ${to} · regions: ${regions} · types: ${types.join(', ') || 'none'}`;
    if (!days.length)
        return [header, coverage, '', `No holidays of the covered types are on record for ${year}.`].join('\n');
    days.sort((a, b) => a.date.month - b.date.month || a.date.day - b.date.day);
    const lines = days.map((d) => `- ${String(d.date.day).padStart(2, '0')}/${String(d.date.month).padStart(2, '0')} (weekday ${d.date.dayOfWeek}) ${d.text} [${d.type}]`);
    return [header, coverage, `${days.length} day(s) across ${new Set(days.map((d) => d.type)).size} type(s):`, '', ...lines.slice(0, 200)].join('\n');
}
