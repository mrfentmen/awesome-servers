/**
 * IBAN Checker — keyless public API client.
 */
export class SourceError extends Error {
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
const LENGTHS = {
    AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BR: 29, BY: 28, CH: 21,
    CR: 22, CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28, EE: 20, EG: 29, ES: 24, FI: 18, FO: 18, FR: 27,
    GB: 22, GE: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21, HU: 28, IE: 22, IL: 23, IQ: 23, IS: 26,
    IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28, LC: 32, LI: 21, LT: 20, LU: 20, LV: 21, LY: 25, MC: 27,
    MD: 24, ME: 22, MK: 19, MR: 27, MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29, PT: 25,
    QA: 29, RO: 24, RS: 22, SA: 24, SC: 31, SE: 24, SI: 19, SK: 24, SM: 27, ST: 25, SV: 28, TL: 23,
    TN: 24, TR: 26, UA: 29, VA: 22, VG: 24, XK: 20,
};
const NAMES = {
    AD: "Andorra", AE: "United Arab Emirates", AL: "Albania", AT: "Austria", AZ: "Azerbaijan",
    BA: "Bosnia and Herzegovina", BE: "Belgium", BG: "Bulgaria", BH: "Bahrain", BR: "Brazil",
    BY: "Belarus", CH: "Switzerland", CR: "Costa Rica", CY: "Cyprus", CZ: "Czechia", DE: "Germany",
    DK: "Denmark", DO: "Dominican Republic", EE: "Estonia", EG: "Egypt", ES: "Spain", FI: "Finland",
    FO: "Faroe Islands", FR: "France", GB: "United Kingdom", GE: "Georgia", GI: "Gibraltar",
    GL: "Greenland", GR: "Greece", GT: "Guatemala", HR: "Croatia", HU: "Hungary", IE: "Ireland",
    IL: "Israel", IQ: "Iraq", IS: "Iceland", IT: "Italy", JO: "Jordan", KW: "Kuwait",
    KZ: "Kazakhstan", LB: "Lebanon", LC: "Saint Lucia", LI: "Liechtenstein", LT: "Lithuania",
    LU: "Luxembourg", LV: "Latvia", LY: "Libya", MC: "Monaco", MD: "Moldova", ME: "Montenegro",
    MK: "North Macedonia", MR: "Mauritania", MT: "Malta", MU: "Mauritius", NL: "Netherlands",
    NO: "Norway", PK: "Pakistan", PL: "Poland", PS: "Palestine", PT: "Portugal", QA: "Qatar",
    RO: "Romania", RS: "Serbia", SA: "Saudi Arabia", SC: "Seychelles", SE: "Sweden", SI: "Slovenia",
    SK: "Slovakia", SM: "San Marino", ST: "Sao Tome and Principe", SV: "El Salvador",
    TL: "Timor-Leste", TN: "Tunisia", TR: "Turkey", UA: "Ukraine", VA: "Vatican City",
    VG: "Virgin Islands (British)", XK: "Kosovo",
};
function mod97(value) {
    let remainder = 0;
    for (const ch of value) {
        const digit = ch >= "0" && ch <= "9" ? Number(ch) : ch.charCodeAt(0) - 55;
        remainder = (remainder * (digit > 9 ? 100 : 10) + digit) % 97;
    }
    return remainder;
}
function formatted(iban) {
    return iban.replace(/(.{4})/g, "$1 ").trim();
}
export async function validateIban(a) {
    const raw = clean(a.iban).replace(/[\s-]/g, "").toUpperCase();
    if (!raw)
        throw new SourceError("iban is required");
    if (raw.length < 5 || raw.length > 34)
        return `Invalid: an IBAN must be 5 to 34 characters, got ${raw.length}.`;
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(raw)) {
        return "Invalid: IBANs start with two letters, two check digits, then letters or digits only.";
    }
    const country = raw.slice(0, 2);
    const expected = LENGTHS[country];
    if (!expected)
        return `Invalid: "${country}" is not an IBAN country code.`;
    if (raw.length !== expected) {
        return `Invalid: ${NAMES[country] ?? country} IBANs are exactly ${expected} characters, got ${raw.length}.`;
    }
    const rearranged = raw.slice(4) + raw.slice(0, 4);
    const check = mod97(rearranged);
    if (check !== 1) {
        return [
            `Invalid checksum: ${raw.slice(2, 4)} are not the right check digits for this IBAN (mod-97 gave ${check}, expected 1).`,
            `Country: ${NAMES[country] ?? country} (${expected} characters)`,
            `Formatted: ${formatted(raw)}`,
        ].join("\n");
    }
    return [
        `Valid IBAN.`,
        "",
        bullet("country", `${NAMES[country] ?? country} (${country})`),
        bullet("check digits", raw.slice(2, 4)),
        bullet("BBAN", raw.slice(4)),
        bullet("formatted", formatted(raw)),
        bullet("length", `${raw.length} characters (${country} requires exactly ${expected})`),
        bullet("checksum", "mod-97 = 1, as required"),
    ]
        .filter(Boolean)
        .join("\n");
}
export async function listIbanCountries(a) {
    const search = clean(a.search).toLowerCase();
    const codes = Object.keys(LENGTHS)
        .filter((code) => !search || code.toLowerCase().includes(search) || (NAMES[code] ?? "").toLowerCase().includes(search))
        .sort();
    if (!codes.length)
        throw new SourceError(`no IBAN country matches "${clean(a.search)}"`);
    return [
        `${codes.length} IBAN country code(s)${search ? ` matching "${clean(a.search)}"` : ""}:`,
        "",
        ...codes.map((code) => `${code}  ${String(LENGTHS[code]).padStart(2)}  ${NAMES[code] ?? ""}`),
    ].join("\n");
}
