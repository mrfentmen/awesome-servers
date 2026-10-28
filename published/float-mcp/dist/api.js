/**
 * IEEE-754 Floats — keyless public API client.
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
function parseNumber(text) {
    const value = clean(text);
    if (/^nan$/i.test(value))
        return NaN;
    if (/^[+-]?inf(inity)?$/i.test(value))
        return value.startsWith("-") ? -Infinity : Infinity;
    if (value === "")
        throw new SourceError("value is required");
    const parsed = Number(value);
    if (Number.isNaN(parsed))
        throw new SourceError(`"${text}" is not a number`);
    return parsed;
}
function f64Bits(value) {
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, value);
    return view.getBigUint64(0);
}
function f32Bits(value) {
    const view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, value);
    return view.getUint32(0);
}
function categoryOf(value, width) {
    if (Number.isNaN(value))
        return "NaN";
    if (value === Infinity || value === -Infinity)
        return "infinity";
    if (value === 0)
        return Object.is(value, -0) ? "negative zero" : "zero";
    const expBits = width === 64 ? 11 : 8;
    const mantBits = width === 64 ? 52 : 23;
    const bits = width === 64 ? f64Bits(value) : BigInt(f32Bits(value));
    const exp = Number((bits >> BigInt(mantBits)) & ((1n << BigInt(expBits)) - 1n));
    if (exp === 0)
        return "subnormal";
    if (exp === (1 << expBits) - 1)
        return "infinity or NaN";
    return "normal";
}
function hex64(bits) {
    return "0x" + bits.toString(16).padStart(16, "0");
}
function decompose(value) {
    const bits = f64Bits(value);
    const sign = Number(bits >> 63n);
    const exp = Number((bits >> 52n) & 0x7ffn);
    const mantissa = bits & 0xfffffffffffffn;
    const fraction = Number(mantissa) / 2 ** 52;
    const unbiased = exp === 0 ? 1 - 1023 : exp - 1023;
    return [
        `sign:     ${sign}`,
        `exponent: ${exp} (unbiased ${unbiased}, bias 1023)`,
        `mantissa: 0x${mantissa.toString(16).padStart(13, "0")} (fraction ${fraction.toFixed(6)})`,
        `value:    ${sign ? "-" : "+"}1.${mantissa.toString(2).padStart(52, "0").slice(0, 10)}... x 2^${unbiased}`,
    ];
}
function nextBits(value, steps) {
    let bits = f64Bits(value);
    if (Number.isNaN(value))
        return bits;
    if (value === 0) {
        return steps > 0 ? bits + BigInt(steps) : bits - BigInt(steps);
    }
    if (value > 0) {
        bits += BigInt(steps);
    }
    else {
        bits -= BigInt(steps);
    }
    return bits;
}
function fromBits(bits) {
    const view = new DataView(new ArrayBuffer(8));
    view.setBigUint64(0, bits);
    return view.getFloat64(0);
}
export async function floatInfo(a) {
    const value = parseNumber(a.value);
    const bits = f64Bits(value);
    const shortest = value.toString();
    const inputText = clean(a.value);
    const rounded = inputText !== shortest && Number(inputText) === value;
    const asF32 = Math.fround(value);
    const f32Loss = !Object.is(asF32, value) && !Number.isNaN(value);
    return [
        `Value: ${value} (${categoryOf(value, 64)})`,
        "",
        bullet("shortest decimal", shortest),
        bullet("f64 bits", hex64(bits)),
        bullet("f64 bytes (BE)", Buffer.from(bits.toString(16).padStart(16, "0"), "hex").toString("hex").replace(/(..)(?=.)/g, "$1 ")),
        !Number.isNaN(value) && Number.isFinite(value) ? `\nIEEE-754 layout:\n${decompose(value).map((l) => `  ${l}`).join("\n")}` : "",
        "",
        bullet("as f32", Number.isFinite(value) ? String(asF32) : shortest),
        bullet("f32 bits", Number.isFinite(value) || Number.isNaN(value) ? "0x" + f32Bits(value).toString(16).padStart(8, "0") : "n/a"),
        f32Loss ? "Note: this value cannot be represented exactly as a 32-bit float." : "",
        rounded ? `Note: "${inputText}" needed rounding — the stored value is ${shortest}.` : "",
        "",
        bullet("next float up", Number.isFinite(value) ? String(fromBits(nextBits(value, 1))) : "n/a"),
        bullet("next float down", Number.isFinite(value) ? String(fromBits(nextBits(value, -1))) : "n/a"),
    ]
        .filter(Boolean)
        .join("\n");
}
export async function bitsToFloat(a) {
    const width = Math.floor(a.width ?? 64);
    if (![32, 64].includes(width))
        throw new SourceError("width must be 32 or 64");
    const cleaned = clean(a.bits).replace(/^0x/i, "");
    if (!/^[0-9a-fA-F]+$/.test(cleaned))
        throw new SourceError("bits must be hex digits, with or without 0x");
    const max = width === 64 ? 16 : 8;
    if (cleaned.length > max)
        throw new SourceError(`${width}-bit values have at most ${max} hex digits`);
    const value = BigInt("0x" + cleaned);
    const view = new DataView(new ArrayBuffer(width === 64 ? 8 : 4));
    if (width === 64)
        view.setBigUint64(0, value);
    else
        view.setUint32(0, Number(value));
    const asFloat = width === 64 ? view.getFloat64(0) : view.getFloat32(0);
    return [
        `0x${cleaned.padStart(max, "0")} as IEEE-754 ${width}-bit float:`,
        "",
        bullet("value", String(asFloat)),
        bullet("category", categoryOf(asFloat, width)),
        bullet("decimal form", Number.isFinite(asFloat) || Number.isNaN(asFloat) ? asFloat.toString() : String(asFloat)),
        bullet("back to bits", width === 64 ? hex64(f64Bits(asFloat)) : "0x" + f32Bits(asFloat).toString(16).padStart(8, "0")),
    ]
        .filter(Boolean)
        .join("\n");
}
export async function nextFloat(a) {
    const value = parseNumber(a.value);
    if (Number.isNaN(value))
        throw new SourceError("NaN has no neighbours");
    const steps = Math.floor(a.steps ?? 1);
    if (!Number.isInteger(steps) || steps === 0 || steps < -1000 || steps > 1000) {
        throw new SourceError("steps must be between -1000 and 1000 and not zero");
    }
    const result = fromBits(nextBits(value, steps));
    return [
        `${steps} step(s) from ${value}:`,
        "",
        bullet("result", String(result)),
        bullet("direction", result > value ? "toward +infinity" : result < value ? "toward -infinity" : "unchanged (infinity or NaN)"),
        bullet("bits", hex64(f64Bits(result))),
        bullet("difference", Number.isFinite(result) && Number.isFinite(value) ? String(result - value) : "n/a"),
    ]
        .filter(Boolean)
        .join("\n");
}
