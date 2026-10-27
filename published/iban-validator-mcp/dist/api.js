import IBAN from "iban";
const UA = "mrfentmen-iban-validator-mcp/1.0";
const anyIBAN = IBAN;
export class IbanError extends Error {
}
export async function validate(args) {
    const value = (args.iban ?? "").trim().replace(/\s+/g, "");
    if (!value)
        throw new IbanError("Provide an IBAN");
    const valid = anyIBAN.isValid(value);
    const formatted = anyIBAN.printFormat(value);
    return `IBAN: ${formatted}\nValidity: ${valid ? "VALID" : "INVALID"}`;
}
export async function info(args) {
    const value = (args.iban ?? "").trim().replace(/\s+/g, "");
    if (!value)
        throw new IbanError("Provide an IBAN");
    if (!anyIBAN.isValid(value))
        throw new IbanError("Not a valid IBAN");
    const country = value.slice(0, 2);
    const bban = value.slice(4);
    return `IBAN: ${anyIBAN.printFormat(value)}\nCountry: ${country} (${anyIBAN.countryInfo?.[country] ?? "n/a"})\nLength: ${value.length} characters\nBBAN: ${bban}`;
}
// ---- muxB tools:
/**
 * BBAN field layouts from the ISO 13616 IBAN registry: country -> total IBAN
 * length and the BBAN fields, longest first, that add up to length - 4. Only the
 * field names and lengths are tabulated here, never any bank's own data.
 */
const LAYOUTS = {
    AD: { length: 24, fields: [["bank code", 4], ["branch code", 4], ["account number", 12]] },
    AT: { length: 20, fields: [["bank code", 5], ["account number", 11]] },
    AZ: { length: 28, fields: [["bank code", 4], ["account number", 20]] },
    BA: { length: 20, fields: [["bank code", 3], ["branch code", 3], ["account number", 8], ["check digits", 2]] },
    BE: { length: 16, fields: [["bank code", 3], ["account number", 7], ["national check digits", 2]] },
    BG: { length: 22, fields: [["bank code", 4], ["branch code", 4], ["account number", 8], ["national check digits", 2]] },
    BR: { length: 29, fields: [["bank code", 8], ["branch code", 5], ["account number", 10], ["account type", 1], ["owner check digit", 1]] },
    CH: { length: 21, fields: [["bank code", 5], ["account number", 12]] },
    CR: { length: 22, fields: [["bank code", 4], ["account number", 14]] },
    CY: { length: 28, fields: [["bank code", 3], ["branch code", 5], ["account number", 16]] },
    CZ: { length: 24, fields: [["bank code", 4], ["branch code", 6], ["account number", 10]] },
    DE: { length: 22, fields: [["bank code", 8], ["account number", 10]] },
    DK: { length: 18, fields: [["bank code", 4], ["account number", 9], ["national check digit", 1]] },
    DO: { length: 28, fields: [["bank code", 4], ["account number", 20]] },
    EE: { length: 20, fields: [["bank code", 2], ["branch code", 2], ["account number", 11], ["national check digit", 1]] },
    ES: { length: 24, fields: [["bank code", 4], ["branch code", 4], ["national check digits", 2], ["account number", 10]] },
    FI: { length: 18, fields: [["bank code", 6], ["account number", 7], ["national check digit", 1]] },
    FO: { length: 18, fields: [["bank code", 4], ["account number", 9], ["national check digit", 1]] },
    FR: { length: 27, fields: [["bank code", 5], ["branch code", 5], ["account number", 11], ["RIB key", 2]] },
    GB: { length: 22, fields: [["bank code", 4], ["sort code", 6], ["account number", 8]] },
    GE: { length: 22, fields: [["bank code", 2], ["account number", 16]] },
    GI: { length: 23, fields: [["bank code", 4], ["account number", 15]] },
    GL: { length: 18, fields: [["bank code", 4], ["account number", 9], ["national check digit", 1]] },
    GR: { length: 27, fields: [["bank code", 3], ["branch code", 4], ["account number", 16]] },
    HR: { length: 21, fields: [["bank code", 7], ["account number", 10]] },
    HU: { length: 28, fields: [["bank code", 3], ["branch code", 4], ["national check digit", 1], ["account number", 15], ["national check digit", 1]] },
    IE: { length: 22, fields: [["bank code", 4], ["branch code", 6], ["account number", 8]] },
    IS: { length: 26, fields: [["bank code", 4], ["branch code", 2], ["account number", 6], ["national identification number", 10]] },
    IT: { length: 27, fields: [["country check digit (CIN)", 1], ["ABI", 5], ["CAB", 5], ["account number", 12]] },
    JO: { length: 30, fields: [["bank code", 4], ["branch code", 4], ["account number", 18]] },
    KW: { length: 30, fields: [["bank code", 4], ["account number", 22]] },
    KZ: { length: 20, fields: [["bank code", 3], ["account number", 13]] },
    LB: { length: 28, fields: [["bank code", 4], ["account number", 20]] },
    LC: { length: 32, fields: [["bank code", 4], ["account number", 24]] },
    LI: { length: 21, fields: [["bank code", 5], ["account number", 11], ["national check letter", 1]] },
    LT: { length: 20, fields: [["bank code", 5], ["account number", 11]] },
    LU: { length: 20, fields: [["bank code", 3], ["account number", 13]] },
    LV: { length: 21, fields: [["bank code", 4], ["account number", 13]] },
    MC: { length: 27, fields: [["bank code", 5], ["branch code", 5], ["account number", 11], ["RIB key", 2]] },
    MD: { length: 24, fields: [["bank code", 2], ["account number", 18]] },
    ME: { length: 22, fields: [["bank code", 3], ["account number", 13], ["national check digits", 2]] },
    MK: { length: 19, fields: [["bank code", 3], ["account number", 10], ["national check digits", 2]] },
    MR: { length: 27, fields: [["bank code", 5], ["branch code", 5], ["account number", 11], ["RIB key", 2]] },
    MT: { length: 31, fields: [["bank code", 4], ["branch code", 5], ["account number", 18]] },
    NL: { length: 18, fields: [["bank code", 4], ["account number", 10]] },
    NO: { length: 15, fields: [["bank code", 4], ["account number", 6], ["national check digit", 1]] },
    PK: { length: 24, fields: [["bank code", 4], ["account number", 16]] },
    PL: { length: 28, fields: [["bank code", 8], ["account number", 16]] },
    PS: { length: 29, fields: [["bank code", 4], ["branch code", 4], ["account number", 17]] },
    PT: { length: 25, fields: [["bank code", 4], ["branch code", 4], ["account number", 11], ["national check digits", 2]] },
    QA: { length: 29, fields: [["bank code", 4], ["account number", 21]] },
    RO: { length: 24, fields: [["bank code", 4], ["account number", 16]] },
    RS: { length: 22, fields: [["bank code", 3], ["account number", 13], ["national check digits", 2]] },
    SA: { length: 24, fields: [["bank code", 2], ["account number", 18]] },
    SE: { length: 24, fields: [["bank code", 3], ["account number", 16], ["national check digit", 1]] },
    SI: { length: 19, fields: [["bank code", 5], ["account number", 8], ["national check digits", 2]] },
    SK: { length: 24, fields: [["bank code", 4], ["branch code", 6], ["account number", 10]] },
    SM: { length: 27, fields: [["country check letter", 1], ["bank code", 5], ["branch code", 5], ["account number", 12]] },
    ST: { length: 25, fields: [["bank code", 4], ["branch code", 4], ["account number", 13]] },
    SV: { length: 28, fields: [["bank code", 4], ["account number", 20]] },
    TL: { length: 23, fields: [["bank code", 3], ["account number", 14], ["national check digits", 2]] },
    TN: { length: 24, fields: [["bank code", 2], ["branch code", 3], ["account number", 13], ["national check digits", 2]] },
    TR: { length: 26, fields: [["bank code", 5], ["national check digit", 1], ["account number", 16]] },
    UA: { length: 29, fields: [["bank code", 6], ["account number", 19]] },
    VA: { length: 22, fields: [["bank code", 3], ["account number", 15]] },
    VG: { length: 24, fields: [["bank code", 4], ["account number", 16]] },
    XK: { length: 20, fields: [["bank code", 2], ["branch code", 2], ["account number", 10], ["national check digits", 2]] },
};
const digitsOf = (value) => value.split("").map(Number);
/** ISO 7064 mod 97-10: move the first four characters to the end, then reduce mod 97. */
function toMod97Digits(value) {
    return [...value]
        .map((char) => {
        const code = char.charCodeAt(0);
        return code >= 65 && code <= 90 ? String(code - 55) : char;
    })
        .join("");
}
function mod97Steps(rearranged, steps = 3) {
    // Letters become their ISO 7064 numbers (A = 10 ... Z = 35) first, exactly as
    // the standard requires, then the number is folded seven digits at a time.
    let rest = toMod97Digits(rearranged);
    const trace = [];
    let shown = 0;
    // The folding always runs to the end; `steps` only limits how much of it is shown.
    while (rest.length > 9) {
        const head = rest.slice(0, 7);
        const value = Number(head) % 97;
        if (shown < steps) {
            trace.push(`${head} mod 97 = ${value}`);
            shown++;
        }
        rest = String(value) + rest.slice(7);
    }
    const remainder = parseInt(rest, 10) % 97;
    trace.push(`${rest} mod 97 = ${remainder}`);
    return { remainder, trace };
}
/**
 * National check digits, for the countries whose scheme is published and could
 * be reproduced from the published example. Each returns the recomputed value
 * or null when the country's scheme is not one of the ones implemented here.
 */
function nationalCheck(country, bban) {
    const last = (n) => bban.slice(-n);
    const body = (n) => bban.slice(0, bban.length - n);
    const digits = (value) => digitsOf(value);
    const pad = (value, width) => String(value).padStart(width, "0");
    if (country === "BE" || country === "MC" || country === "MR") {
        if (country === "BE") {
            const computed = pad(parseInt(body(2), 10) % 97, 2);
            return { label: "national check digits, BBAN mod 97", computed, found: last(2) };
        }
        const bank = parseInt(bban.slice(0, 5), 10);
        const branch = parseInt(bban.slice(5, 10), 10);
        const account = parseInt(bban.slice(10, 21).replace(/[A-Z]/g, (char) => String(char.charCodeAt(0) - 55)), 10);
        return {
            label: "RIB key, 97 - (bank x 89 + branch x 15 + account x 3) mod 97",
            computed: pad(97 - ((bank * 89 + branch * 15 + account * 3) % 97), 2),
            found: last(2),
        };
    }
    if (country === "ES") {
        const weights = [1, 2, 4, 8, 5, 3, 7, 6, 1, 2, 3, 5, 9, 8, 7, 6, 4, 2, 3, 5];
        const sum = digits(bban.slice(0, 20)).reduce((total, digit, index) => total + (digit * weights[index]) % 10, 0);
        const first = sum % 10;
        const second = ((9 - sum) % 10 + 10) % 10;
        return { label: "national check digits, weighted digit sum", computed: `${first}${second}`, found: bban.slice(8, 10) };
    }
    if (country === "EE") {
        const weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6];
        const sum = digits(body(1)).reduce((total, digit, index) => total + digit * (weights[index] ?? 0), 0);
        return { label: "national check digit, (10 - weighted sum mod 10) mod 10", computed: String((10 - (sum % 10)) % 10), found: last(1) };
    }
    if (country === "FI" || country === "SE") {
        const width = country === "FI" ? 1 : 1;
        const numbers = digits(body(width)).reverse();
        const sum = numbers.reduce((total, digit, index) => {
            const product = digit * (index % 2 === 0 ? 2 : 1);
            return total + (product > 9 ? product - 9 : product);
        }, 0);
        return { label: "national check digit, Luhn sum mod 10", computed: String((10 - (sum % 10)) % 10), found: last(1) };
    }
    return null;
}
export async function bbanStructure(args) {
    const value = (args.iban ?? "").trim().replace(/\s+/g, "").toUpperCase();
    if (!value)
        throw new IbanError("Provide an IBAN");
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(value)) {
        throw new IbanError("That does not look like an IBAN: two letters, two digits, then letters and digits");
    }
    const country = value.slice(0, 2);
    const checkDigits = value.slice(2, 4);
    const bban = value.slice(4);
    const layout = LAYOUTS[country];
    const lines = [
        `IBAN: ${anyIBAN.printFormat(value)}`,
        `country code: ${country} (a two-letter ISO 3166-1 country code; no bank directory is consulted)`,
        `IBAN check digits: ${checkDigits} | BBAN: ${bban} (${bban.length} characters)`,
    ];
    // Verification rearranges the IBAN by moving its first four characters to the
    // end; the whole number then has to come out as 1 mod 97.
    const rearranged = `${bban}${country}${checkDigits}`;
    const { remainder, trace } = mod97Steps(rearranged);
    lines.push(`ISO 7064 mod 97-10 over "${rearranged}": ${remainder} ${remainder === 1 ? "(1, so the check digits agree)" : "(should be 1, so the check digits do not agree)"}`, ...trace.map((step) => `   ${step}`));
    if (layout) {
        const tabulated = layout.fields.reduce((total, [, size]) => total + size, 0);
        if (tabulated !== layout.length - 4) {
            lines.push(`layout for ${country} is inconsistent (${tabulated} field characters for a ${layout.length - 4} character BBAN), so no breakdown is shown`);
        }
        else if (value.length !== layout.length) {
            lines.push(`${country} IBANs are ${layout.length} characters and this one has ${value.length}, so the fields are not split here`);
        }
        else {
            let offset = 0;
            for (const [name, size] of layout.fields) {
                lines.push(`   ${name}: ${bban.slice(offset, offset + size)}`);
                offset += size;
            }
        }
    }
    else {
        lines.push(`no BBAN field layout is tabulated for ${country}, so no field breakdown is shown`);
    }
    const national = nationalCheck(country, bban);
    if (national) {
        const match = national.computed === national.found;
        lines.push(`national check (${national.label}): recomputed ${national.computed}, IBAN carries ${national.found} - ${match ? "they agree" : "they do not agree"}`);
    }
    else {
        lines.push(`national check digits: not tabulated for ${country}, only the ISO 7064 mod 97 check is recomputed here`);
    }
    lines.push(`overall: ${anyIBAN.isValid(value) ? "VALID according to the iban library" : "INVALID according to the iban library"}`);
    lines.push("no bank directory is consulted, so nothing here says which institution holds the account");
    return lines.join("\n");
}
export async function batchValidate(args) {
    const raw = (args.ibans ?? "").trim();
    if (!raw)
        throw new IbanError("Provide a list of IBANs, separated by commas, spaces or newlines");
    const limit = Math.min(Math.max(Math.trunc(Number(args.limit ?? 50)), 1), 200);
    const list = raw.split(/[\s,;]+/).map((entry) => entry.trim().toUpperCase()).filter(Boolean);
    if (!list.length)
        throw new IbanError("No IBAN found in that list");
    const shown = list.slice(0, limit);
    const dropped = list.length - shown.length;
    const rows = [];
    const countries = new Map();
    let valid = 0;
    const failures = [];
    for (const entry of shown) {
        const country = entry.slice(0, 2);
        const perCountry = countries.get(country) ?? { total: 0, valid: 0 };
        perCountry.total++;
        const looksShaped = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(entry);
        const layout = LAYOUTS[country];
        const lengthOk = looksShaped && (!layout || entry.length === layout.length);
        const checksumOk = looksShaped && mod97Steps(`${entry.slice(4)}${entry.slice(0, 4)}`).remainder === 1;
        const isValid = looksShaped && anyIBAN.isValid(entry);
        if (isValid) {
            valid++;
            perCountry.valid++;
        }
        const problems = [];
        if (!looksShaped)
            problems.push("malformed");
        if (looksShaped && !lengthOk)
            problems.push(`length ${entry.length}${layout ? `, ${country} uses ${layout.length}` : ", not tabulated"}`);
        if (looksShaped && !checksumOk)
            problems.push("mod 97 check digits do not agree");
        if (looksShaped && checksumOk && !isValid)
            problems.push("rejected by the iban library");
        if (problems.length)
            failures.push(`   ${entry}: ${problems.join("; ")}`);
        rows.push(`   ${entry} ${country}: ${isValid ? "VALID" : "INVALID"}${problems.length ? ` (${problems.join("; ")})` : ""}`);
    }
    const byCountry = [...countries.entries()]
        .sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]))
        .map(([country, counts]) => `${country} ${counts.valid}/${counts.total}`);
    return [
        `checked ${shown.length} IBAN${shown.length === 1 ? "" : "s"}: ${valid} valid, ${shown.length - valid} invalid${dropped ? `, ${dropped} not shown (limit ${limit})` : ""}`,
        `by country: ${byCountry.join(" | ") || "none"}`,
        "",
        ...rows,
        ...(failures.length ? ["", `${failures.length} to look at:`, ...failures] : []),
    ].join("\n");
}
