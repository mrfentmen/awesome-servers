import bwipjs from "bwip-js";
const UA = "mrfentmen-barcode-mcp/1.0 (https://github.com/mrfentmen)";
export class BarcodeError extends Error {
}
function svg(bcid, text) {
    try {
        return bwipjs.toSVG({ bcid, text, scale: 3, height: 12, includetext: true, textxalign: "center" });
    }
    catch (e) {
        throw new BarcodeError(`Barcode generation failed: ${e instanceof Error ? e.message : String(e)}`);
    }
}
export async function generateEan(args) {
    const code = (args.code ?? "").trim();
    if (!/^\d{12,13}$/.test(code))
        throw new BarcodeError("Provide a 12 or 13 digit EAN code");
    const s = await svg("ean13", code);
    return `EAN-13 barcode for ${code}:\n${s}`;
}
export async function generateCode128(args) {
    const text = (args.text ?? "").trim();
    if (!text)
        throw new BarcodeError("Provide text to encode");
    if (text.length > 80)
        throw new BarcodeError("Text is too long, keep it under 80 characters");
    const s = await svg("code128", text);
    return `Code-128 barcode for "${text}":\n${s}`;
}
// ---- muxA tools:
function cap(value, fallback, max) {
    return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}
function render(bcid, text, opts) {
    try {
        return bwipjs.toSVG({
            bcid,
            text,
            scale: Math.max(1, Math.min(Math.round(opts.scale ?? 3), 6)),
            height: Math.max(4, Math.min(Math.round(opts.height ?? 12), 30)),
            includetext: opts.includetext !== false,
            textxalign: "center",
        });
    }
    catch (e) {
        throw new BarcodeError(`Barcode generation failed: ${e instanceof Error ? e.message : String(e)}`);
    }
}
export async function generateQrCode(args) {
    const text = (args.text ?? "").trim();
    if (!text)
        throw new BarcodeError("Provide text or a URL to encode.");
    const ec = (args.error_correction ?? "M").toUpperCase();
    if (!["L", "M", "Q", "H"].includes(ec)) {
        return `Unknown error correction level ${args.error_correction}. Use L, M, Q or H.`;
    }
    const scale = cap(args.scale, 3, 8);
    const s = render("qrcode", text, { scale, height: 10 });
    return [
        `QR code (error correction ${ec}, scale ${scale}) for ${text.length} character(s):`,
        text.length <= 60 ? `  encodes: ${text}` : `  encodes: ${text.slice(0, 57)}...`,
        s,
        "L recovers about 7% of the code, M about 15%, Q about 25% and H about 30%.",
    ].join("\n");
}
export async function generateTwoDimensional(args) {
    const text = (args.text ?? "").trim();
    if (!text)
        throw new BarcodeError("Provide text to encode.");
    const format = (args.format ?? "datamatrix").trim().toLowerCase();
    const supported = {
        datamatrix: "datamatrix",
        "data matrix": "datamatrix",
        pdf417: "pdf417",
        maxicode: "maxicode",
        "aztec": "azteccode",
        azteccode: "azteccode",
    };
    const bcid = supported[format];
    if (!bcid) {
        return `Unknown 2D format "${args.format}". Use datamatrix, pdf417, maxicode or aztec.`;
    }
    const scale = cap(args.scale, 2, 6);
    const s = render(bcid, text, { scale, height: 10, includetext: false });
    return `2D ${format} barcode (scale ${scale}) for ${text.length} character(s):\n${s}`;
}
function eanCheckDigit(first12) {
    let sum = 0;
    for (let i = 0; i < 12; i += 1) {
        sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
    }
    return (10 - (sum % 10)) % 10;
}
function upcCheckDigit(first11) {
    let sum = 0;
    for (let i = 0; i < 11; i += 1) {
        sum += Number(first11[i]) * (i % 2 === 0 ? 3 : 1);
    }
    return (10 - (sum % 10)) % 10;
}
export async function validateBarcode(args) {
    const code = (args.code ?? "").trim();
    if (!code)
        throw new BarcodeError("Provide the digits to check.");
    const requested = (args.symbology ?? "").trim().toLowerCase();
    const digits = code.replace(/[\s-]/g, "");
    if (!/^\d+$/.test(digits)) {
        return `"${code}" is not numeric. Only the UPC and EAN family use digits alone; other symbologies carry letters.`;
    }
    const candidates = [
        // label, expected length, body length
        ["EAN-13", 13, 12],
        ["EAN-8", 8, 7],
        ["UPC-A", 12, 11],
    ];
    const matches = candidates.filter(([, len]) => len === digits.length);
    if (!matches.length) {
        return `"${code}" has ${digits.length} digits. Recognised lengths are EAN-13 (13), EAN-8 (8) and UPC-A (12).`;
    }
    if (requested) {
        const only = matches.filter(([label]) => label.toLowerCase().replace(/[^a-z]/g, "") === requested.replace(/[^a-z]/g, ""));
        if (!only.length) {
            return `A ${digits.length} digit code is not ${requested}. Recognised: ${matches.map(([l]) => l).join(", ")}.`;
        }
        matches.length = 0;
        matches.push(...only);
    }
    const lines = [];
    for (const [label, , bodyLen] of matches) {
        const body = digits.slice(0, bodyLen);
        const expected = label === "UPC-A" ? upcCheckDigit(body) : eanCheckDigit(body);
        const actual = Number(digits[bodyLen]);
        const valid = expected === actual;
        lines.push(`${label}: ${valid ? "VALID" : "INVALID"}`, `  body ${body}`, `  expected check digit ${expected}, found ${actual}`, `  corrected full code ${body}${expected}`);
    }
    if (digits.length === 13) {
        lines.push("", `EAN-13 country prefix ${digits.slice(0, 3)} suggests GS1 prefix range ${digits.slice(0, 3)}; the leading digit is the encoding (0 UPC-A, 1 EAN-8 upcoded, 2 weighted, 3 drug, 4 restricted, 5 coupons, 6/7 weighted, 8/9 standard).`);
    }
    return lines.join("\n");
}
