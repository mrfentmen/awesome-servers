import { parsePhoneNumberFromString } from "libphonenumber-js";
const UA = "mrfentmen-phone-validator-mcp/1.0";
export class PhoneError extends Error {
}
export async function validate(args) {
    const number = (args.number ?? "").trim();
    if (!number)
        throw new PhoneError("Provide a phone number");
    const country = (args.country ?? "").trim().toUpperCase();
    let parsed;
    try {
        parsed = country ? parsePhoneNumberFromString(number, country) : parsePhoneNumberFromString(number);
    }
    catch {
        parsed = null;
    }
    if (!parsed || !parsed.isValid()) {
        return `"${number}" is not a valid phone number${country ? ` for ${country}` : ""}`;
    }
    return [
        `Number: ${number}`,
        `Validity: VALID`,
        `E.164: ${parsed.number}`,
        `Country: ${parsed.country ?? "n/a"} (${parsed.countryCallingCode ? "+" + parsed.countryCallingCode : "n/a"})`,
        `Type: ${parsed.getType?.() ?? "n/a"}`,
        `National format: ${parsed.formatNational()}`,
        `International format: ${parsed.formatInternational()}`,
    ].join("\n");
}
// ---- muxB tools:
async function worldTime(zone) {
    const res = await fetch(`https://timeapi.io/api/Time/current/zone?timeZone=${encodeURIComponent(zone)}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 400)
        throw new PhoneError(`TimeAPI.io does not know the time zone "${zone}".`);
    if (!res.ok)
        throw new PhoneError(`TimeAPI.io returned ${res.status}`);
    return (await res.json());
}
export async function zoneTime(args) {
    const zone = (args.timezone ?? "").trim();
    if (!zone)
        throw new PhoneError('Provide an IANA time zone such as Europe/London or America/New_York');
    const d = await worldTime(zone);
    const stamp = d.dateTime != null ? String(d.dateTime).slice(0, 19).replace("T", " ") : "not reported";
    return [
        `Current time in ${String(d.timeZone ?? zone)}`,
        `   local date and time: ${stamp}`,
        `   day of week: ${d.dayOfWeek != null ? String(d.dayOfWeek) : "not reported"}`,
        `   daylight saving active: ${d.dstActive === true ? "yes" : d.dstActive === false ? "no" : "not reported"}`,
        `   reported by: timeapi.io (Time API)`,
    ].join("\n");
}
export async function countryContext(args) {
    const number = (args.number ?? "").trim();
    const countryHint = (args.country ?? "").trim().toUpperCase();
    if (!number && !countryHint)
        throw new PhoneError("Provide a phone number, a country code, or both");
    let iso = countryHint;
    let fromNumber = "not reported";
    if (number) {
        let parsed;
        try {
            parsed = countryHint ? parsePhoneNumberFromString(number, countryHint) : parsePhoneNumberFromString(number);
        }
        catch {
            parsed = null;
        }
        if (parsed?.isValid() && parsed.country) {
            iso = parsed.country;
            fromNumber = `${number} resolves to ${parsed.country} (+${parsed.countryCallingCode ?? "?"})`;
        }
    }
    if (!/^[A-Z]{2}$/.test(iso)) {
        return `Could not work out a two letter country code from that input. ${fromNumber}. Provide a number in international format or a country hint.`;
    }
    const res = await fetch(`https://api.worldbank.org/v2/country/${encodeURIComponent(iso)}?format=json`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new PhoneError(`World Bank returned ${res.status} for ${iso}`);
    const body = (await res.json());
    const c = (body?.[1] ?? [])[0];
    const name = c?.name;
    if (!name)
        return `The World Bank has no record for country code ${iso}.`;
    const popRes = await fetch(`https://api.worldbank.org/v2/country/${encodeURIComponent(iso)}/indicator/SP.POP.TOTL?format=json&mrnev=1&per_page=1`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    let population = "not reported";
    if (popRes.ok) {
        const pb = (await popRes.json());
        const row = Array.isArray(pb?.[1]) ? pb[1][0] : undefined;
        if (row)
            population = `${row.value != null ? Number(row.value).toLocaleString("en-US") : "no value reported"} (${row.date ?? "year not reported"})`;
    }
    const region = c?.region;
    const income = c?.incomeLevel;
    return [
        `Country context for ${name} (${iso})`,
        `   source of the country: ${fromNumber}`,
        `   region: ${region?.value != null ? String(region.value) : "not reported"} | income level: ${income?.value != null ? String(income.value) : "not reported"}`,
        `   capital: ${c?.capitalCity != null ? String(c.capitalCity) : "not reported"}`,
        `   latest total population: ${population}`,
        `   reported by: World Bank`,
    ].join("\n");
}
