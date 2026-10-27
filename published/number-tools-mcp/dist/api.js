const UA = "mrfentmen-number-tools-mcp/1.0";
export class NumberError extends Error {
}
export async function convertBase(args) {
    const value = (args.value ?? "").trim();
    if (!value)
        throw new NumberError("Provide a number as text");
    const from = Math.min(Math.max(args.from ?? 10, 2), 36);
    const to = Math.min(Math.max(args.to ?? 10, 2), 36);
    try {
        const decimal = parseInt(value, from);
        if (Number.isNaN(decimal))
            throw new Error("invalid");
        const negative = decimal < 0;
        const abs = Math.abs(decimal);
        const out = negative ? "-" + abs.toString(to) : abs.toString(to);
        return `${value} (base ${from}) = ${out} (base ${to})`;
    }
    catch {
        throw new NumberError(`Invalid number for base ${from}`);
    }
}
const ROMAN = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];
function toRoman(n) {
    let out = "";
    let v = n;
    for (const [num, sym] of ROMAN) {
        while (v >= num) {
            out += sym;
            v -= num;
        }
    }
    return out;
}
function fromRoman(s) {
    const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0;
    for (let i = 0; i < s.length; i++) {
        const cur = map[s[i]] ?? 0;
        const next = map[s[i + 1]] ?? 0;
        total += cur < next ? -cur : cur;
    }
    return total;
}
export async function roman(args) {
    const value = (args.value ?? "").trim();
    if (!value)
        throw new NumberError("Provide a number or roman numeral");
    if (/^[0-9]+$/.test(value)) {
        const n = parseInt(value, 10);
        if (n < 1 || n > 3999)
            throw new NumberError("Only 1 to 3999 supported");
        return `${n} = ${toRoman(n)}`;
    }
    if (/^[IVXLCDM]+$/.test(value.toUpperCase())) {
        const n = fromRoman(value.toUpperCase());
        if (n < 1 || n > 3999)
            throw new NumberError("Invalid roman numeral");
        return `${value.toUpperCase()} = ${n}`;
    }
    throw new NumberError("Provide a number or a valid roman numeral");
}
const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function three(n) {
    const parts = [];
    if (n >= 100)
        parts.push(ONES[Math.floor(n / 100)] + " hundred");
    const rest = n % 100;
    if (rest >= 20) {
        const t = TENS[Math.floor(rest / 10)];
        const o = ONES[rest % 10];
        parts.push(o ? `${t} ${o}` : t);
    }
    else if (rest > 0) {
        parts.push(ONES[rest]);
    }
    return parts.join(" ");
}
export async function spellNumber(args) {
    const n = args.value;
    if (n === undefined || !Number.isInteger(n) || Math.abs(n) > 999999) {
        throw new NumberError("Provide an integer up to 999,999");
    }
    if (n === 0)
        return "0 = zero";
    const sign = n < 0 ? "negative " : "";
    const abs = Math.abs(n);
    const thousands = Math.floor(abs / 1000);
    const remainder = abs % 1000;
    let words = sign;
    if (thousands)
        words += three(thousands) + " thousand";
    if (thousands && remainder)
        words += " ";
    if (remainder)
        words += three(remainder);
    return `${n} = ${words}`;
}
// ---- muxB tools:
export async function continuedFraction(args) {
    const terms = Math.min(Math.max(Math.trunc(Number(args.terms ?? 8)), 1), 40);
    const from = (args.from ?? "").trim();
    let value;
    let exact = null;
    if (from) {
        if (!/^-?\d+\s*\/\s*\d+$/.test(from))
            throw new NumberError("Give the fraction as text, e.g. 355/113");
        const [a, b] = from.split("/").map((part) => parseInt(part.trim(), 10));
        if (!b)
            throw new NumberError("The denominator of that fraction is zero");
        value = a / b;
        exact = `${a}/${b}`;
    }
    else {
        if (args.value === undefined || !Number.isFinite(Number(args.value))) {
            throw new NumberError("Provide a value, or from as a fraction like 355/113");
        }
        value = Number(args.value);
        if (Math.abs(value) > 1e12)
            throw new NumberError("Keep the value at 1,000,000,000,000 or below in magnitude");
    }
    if (!Number.isFinite(value))
        throw new NumberError("That value has no continued fraction");
    // Euclidean algorithm on the fractional part, the same way a hand computation runs.
    const whole = Math.trunc(value);
    let rest = Math.abs(value - whole);
    const partial = [whole];
    for (let i = 1; i < terms && rest > 1e-12; i++) {
        const next = 1 / rest;
        const term = Math.floor(next);
        partial.push(term);
        rest = next - term;
    }
    // Convergents p/q, kept as exact numbers while they stay inside the double range.
    const rows = [];
    let pPrev = 1;
    let qPrev = 0;
    let p = whole;
    let q = 1;
    for (let i = 0; i < partial.length; i++) {
        if (i > 0) {
            const nextP = partial[i] * p + pPrev;
            const nextQ = partial[i] * q + qPrev;
            pPrev = p;
            qPrev = q;
            p = nextP;
            q = nextQ;
        }
        if (!Number.isFinite(p) || !Number.isFinite(q))
            break;
        const exactValue = `${p}/${q}`;
        rows.push(`   ${exactValue.padStart(24)} = ${p / q}   error ${Math.abs(p / q - value).toExponential(2)}`);
    }
    return [
        `${exact ? `continued fraction of ${exact} (= ${value})` : `continued fraction of ${value}`}`,
        `   [${partial.join("; ")}${rest > 1e-12 ? "; ..." : ""}]`,
        `   ${partial.length} term${partial.length > 1 ? "s" : ""} requested: ${terms}`,
        `   convergents:`,
        ...rows,
    ].join("\n");
}
