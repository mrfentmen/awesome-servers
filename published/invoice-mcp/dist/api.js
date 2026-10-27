// ---- muxG tools:
const INVOICE_FX = "https://api.frankfurter.app";
// Country prefix -> national VAT number length, for the checks that are plain
// mod-11 over the national part. Others are listed for the report only.
const VAT_LENGTHS = {
    AT: 9, BE: 10, BG: 10, CY: 9, CZ: 10, DE: 9, DK: 8, EE: 9, EL: 9, ES: 9, FI: 8,
    FR: 11, HR: 11, HU: 9, IE: 9, IT: 11, LT: 10, LV: 11, NL: 12, PL: 10, PT: 9,
    RO: 10, SE: 12, SI: 10, SK: 10,
};
const IBAN_LENGTHS = {
    AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BR: 29,
    BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28, EE: 20, EG: 29,
    ES: 24, FI: 18, FO: 18, FR: 27, GB: 22, GE: 22, GI: 23, GL: 18, GR: 27, GT: 28,
    HR: 21, HU: 28, IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28,
    LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19, MR: 27, MT: 31,
    MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29, PT: 25, QA: 29, RO: 24, RS: 22,
    SA: 24, SE: 24, SI: 19, SK: 24, SM: 27, ST: 25, SV: 28, TL: 23, TN: 24, TR: 26,
    UA: 29, VA: 22, VG: 24, XK: 20,
};
const digits = (value) => value.replace(/\D/g, "");
/** The ISO 7064 MOD 11-2 check digit scheme, which most EU VAT numbers use. */
const mod11 = (body) => {
    let total = 0;
    let double = true;
    for (let i = body.length - 1; i >= 0; i -= 1) {
        let value = Number(body[i]);
        if (double) {
            value *= 2;
            if (value > 9)
                value = (value % 10) + 1;
        }
        total += value;
        double = !double;
    }
    return (10 - (total % 10)) % 10;
};
export class InvoiceError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvoiceError";
    }
}
const alnum = (value) => String(value ?? "").replace(/[^0-9A-Za-z]/g, "").toUpperCase();
/** Remainder of a long numeric string modulo 97, chunked so nothing overflows. */
const mod97 = (numeric) => {
    let rem = 0;
    for (const ch of numeric)
        rem = (rem * 10 + Number(ch)) % 97;
    return rem;
};
const lettersToDigits = (value) => value.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
// ISO 7064 MOD 11,10 over the first eight digits, which is what Germany uses.
const deVatCheck = (first8) => {
    let product = 10;
    for (const ch of first8) {
        let sum = (Number(ch) + product) % 10;
        if (sum === 0)
            sum = 10;
        product = (sum * 2) % 11;
    }
    const check = 11 - product;
    return check === 10 ? 0 : check;
};
// The Italian VAT number carries a Luhn check digit over all eleven digits.
const luhnOk = (value) => {
    let sum = 0;
    let double = false;
    for (let i = value.length - 1; i >= 0; i -= 1) {
        let d = Number(value[i]);
        if (double) {
            d *= 2;
            if (d > 9)
                d -= 9;
        }
        sum += d;
        double = !double;
    }
    return sum % 10 === 0;
};
// Portugal weights the first eight digits 9..2 against modulus 11, and a
// remainder that would give a check digit of 10 or 11 is written as 0.
const PT_WEIGHTS = [9, 8, 7, 6, 5, 4, 3, 2];
const ptVatCheck = (first8) => {
    let total = 0;
    for (let i = 0; i < 8; i += 1)
        total += Number(first8[i]) * PT_WEIGHTS[i];
    const check = 11 - (total % 11);
    return check >= 10 ? 0 : check;
};
const UK_WEIGHTS = [8, 7, 6, 5, 4, 3, 2];
/** UK VAT: weights 8..2 over the first seven digits, remainder subtracted from 97. */
const ukVatCheck = (first7) => {
    let total = 0;
    for (let i = 0; i < 7; i += 1)
        total += Number(first7[i]) * UK_WEIGHTS[i];
    const expected = 97 - (total % 97);
    return expected === 97 ? 0 : expected;
};
const VAT_ALIASES = { UK: "GB", GR: "EL" };
const VAT_CHECKED = {
    DE: "ISO 7064 MOD 11,10",
    NL: "mod 97 with the B suffix",
    BE: "mod 97 complement",
    PT: "ISO 7064 MOD 11-2",
    IT: "Luhn",
    FR: "mod 97 key over the SIREN",
    GB: "weighted 97 rule",
};
export function vatNumberCheck(vatNumber) {
    const raw = String(vatNumber ?? "").trim();
    if (!raw)
        throw new InvoiceError("Give a VAT number, with or without its country prefix.");
    const clean = alnum(raw);
    if (clean.length < 4)
        throw new InvoiceError(`"${raw}" is too short to be a VAT number.`);
    let prefix = clean.slice(0, 2);
    if (!/^[A-Z]{2}$/.test(prefix))
        throw new InvoiceError(`A VAT number starts with a two-letter country code, and "${raw}" does not.`);
    prefix = VAT_ALIASES[prefix] ?? prefix;
    const known = prefix in VAT_LENGTHS || prefix === "GB" || prefix === "EL";
    if (!known)
        throw new InvoiceError(`${prefix} is not a VAT country this tool knows; expected one of ${Object.keys(VAT_LENGTHS).sort().join(', ')}, GB.`);
    const national = clean.slice(2);
    const expectedLength = prefix === "GB" ? null : VAT_LENGTHS[prefix];
    const lines = [`VAT check for ${prefix}${national}`];
    const problems = [];
    if (expectedLength !== null && national.length !== expectedLength) {
        problems.push(`the national part has ${national.length} character(s) where ${prefix} uses ${expectedLength}`);
    }
    let verified = null;
    if (prefix === "DE" && /^\d{9}$/.test(national)) {
        verified = deVatCheck(national.slice(0, 8)) === Number(national[8]);
    }
    else if (prefix === "NL" && /^\d{9}B\d{2}$/.test(national)) {
        verified = mod97(national.slice(0, 9)) === Number(national.slice(10));
    }
    else if (prefix === "BE" && /^\d{10}$/.test(national)) {
        const complement = 97 - mod97(national.slice(0, 8));
        verified = complement === Number(national.slice(8));
    }
    else if (prefix === "PT" && /^\d{9}$/.test(national)) {
        verified = ptVatCheck(national.slice(0, 8)) === Number(national[8]);
    }
    else if (prefix === "IT" && /^\d{11}$/.test(national)) {
        verified = luhnOk(national);
    }
    else if (prefix === "FR" && /^\d{2}\d{9}$/.test(national)) {
        verified = (12 + 3 * (Number(national.slice(2)) % 97)) % 97 === Number(national.slice(0, 2));
    }
    else if (prefix === "GB" && /^\d{9}$/.test(national)) {
        verified = ukVatCheck(national.slice(0, 7)) === Number(national.slice(7));
    }
    else if (prefix === "GB" && /^\d{12}$/.test(national)) {
        verified = ukVatCheck(national.slice(0, 7)) === Number(national.slice(10));
    }
    if (verified === false)
        problems.push(`the check digit does not match the ${VAT_CHECKED[prefix]} rule`);
    lines.push(`Country: ${prefix} | national part: ${national} (${national.length} character(s))`);
    if (verified !== null)
        lines.push(`Checksum: ${VAT_CHECKED[prefix]} — ${verified ? "passes" : "FAILS"}`);
    else if (VAT_CHECKED[prefix])
        lines.push(`Checksum: ${VAT_CHECKED[prefix]} could not be applied, because the national part is not in that country's shape.`);
    else
        lines.push("Checksum: this tool verifies the format and length only for this country; no national checksum is applied.");
    lines.push(problems.length
        ? `Result: not valid — ${problems.join("; ")}.`
        : verified === true
            ? "Result: the number passes its country's checksum and length."
            : "Result: the format and length look right, but the checksum was not verified, so this is not proof the number is registered.");
    lines.push("A checksum proves the digits are self-consistent, not that the number is live at the tax authority.");
    return lines.join("\n");
}
// Where each country keeps its bank identifier inside the BBAN, and what it is called.
const BBAN_BANK = {
    DE: { start: 0, end: 8, label: "Bankleitzahl" },
    AT: { start: 0, end: 5, label: "bank code" },
    CH: { start: 0, end: 5, label: "clearing number" },
    NL: { start: 0, end: 4, label: "bank code" },
    BE: { start: 0, end: 3, label: "bank code" },
    FR: { start: 0, end: 5, label: "code banque" },
    ES: { start: 0, end: 4, label: "bank code" },
    IT: { start: 0, end: 5, label: "ABI" },
    IE: { start: 0, end: 4, label: "bank code" },
    PT: { start: 0, end: 4, label: "bank code" },
};
export function ibanCheck(iban) {
    const raw = String(iban ?? "").trim();
    if (!raw)
        throw new InvoiceError("Give an IBAN, spaces allowed.");
    const clean = alnum(raw);
    if (clean.length < 5)
        throw new InvoiceError(`"${raw}" is too short to be an IBAN.`);
    if (!/^[A-Z]{2}\d{2}/.test(clean))
        throw new InvoiceError("An IBAN starts with a two-letter country code and two check digits.");
    const country = clean.slice(0, 2);
    const checkDigits = clean.slice(2, 4);
    const bban = clean.slice(4);
    const expected = IBAN_LENGTHS[country];
    const lines = [`IBAN check for ${clean}`];
    const problems = [];
    if (expected === undefined)
        problems.push(`${country} is not in the IBAN length table, so the length cannot be checked`);
    else if (clean.length !== expected)
        problems.push(`the IBAN has ${clean.length} character(s) where ${country} uses ${expected}`);
    const rearranged = lettersToDigits(bban + country + checkDigits);
    const remainder = mod97(rearranged);
    if (remainder !== 1)
        problems.push(`the ISO 7064 mod-97-10 checksum leaves ${remainder} instead of 1`);
    const layout = BBAN_BANK[country];
    const bank = layout && bban.length >= layout.end ? bban.slice(layout.start, layout.end) : null;
    lines.push(`Country: ${country} | check digits: ${checkDigits} | BBAN: ${bban} (${bban.length} character(s))`);
    lines.push(layout
        ? `Bank identifier: ${bank} (${layout.label})`
        : `Bank identifier: not decoded for ${country}; the BBAN layout is not in this tool's table.`);
    lines.push(layout && bban.length > layout.end ? `Account part: ${bban.slice(layout.end)}` : "Account part: see the BBAN above.");
    lines.push(`Checksum: ISO 7064 mod 97-10 — ${remainder === 1 ? "passes" : "FAILS"} (remainder ${remainder})`);
    lines.push(problems.length
        ? `Result: not valid — ${problems.join("; ")}.`
        : "Result: the IBAN passes its country length and the mod-97 checksum.");
    return lines.join("\n");
}
export async function currencyReference(amount, from, to) {
    const value = Number(amount);
    if (!Number.isFinite(value))
        throw new InvoiceError("Give the invoice total as a number.");
    const base = String(from ?? "").trim().toUpperCase();
    const target = String(to ?? "").trim().toUpperCase();
    for (const [code, label] of [[base, "source"], [target, "target"]]) {
        if (!/^[A-Z]{3}$/.test(code))
            throw new InvoiceError(`The ${label} currency must be a three-letter code such as USD or EUR.`);
    }
    if (base === target) {
        return [`Invoice reference for ${value.toFixed(2)} ${base}`, `Source and target currency are both ${base}, so the rate is 1 and the converted figure is ${value.toFixed(2)} ${base}.`].join("\n");
    }
    let res;
    try {
        res = await fetch(`${INVOICE_FX}/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`, { signal: AbortSignal.timeout(20000), headers: { Accept: "application/json" } });
    }
    catch (e) {
        throw new InvoiceError(`Network error reading the ECB reference rates: ${e.message}`);
    }
    if (!res.ok)
        throw new InvoiceError(`ECB rate service answered HTTP ${res.status} for ${base}/${target}.`);
    const data = await res.json();
    const rate = Number(data?.rates?.[target]);
    if (!Number.isFinite(rate) || rate <= 0)
        throw new InvoiceError(`${base}/${target} is not a pair the ECB publishes, so there is no reference rate for it.`);
    const converted = value * rate;
    return [
        `Invoice reference: ${value.toFixed(2)} ${base} in ${target}`,
        `Rate: 1 ${base} = ${rate} ${target} (ECB reference rate dated ${data?.date ?? "unknown"})`,
        `Converted total: ${converted.toFixed(2)} ${target}`,
        "ECB reference rates are published once a working day around 16:00 CET and are not a dealing rate.",
    ].join("\n");
}
export {};
