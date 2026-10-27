const UA = 'mrfentmen-upcitemdb-mcp/1.0';
export async function lookup(args) {
    const upc = (args.upc ?? '').trim();
    if (!upc)
        return 'Provide a UPC/EAN code.';
    const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(upc)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`UPCitemdb returned ${res.status}`);
    const d = (await res.json());
    const items = d.items ?? [];
    if (!items.length)
        return `No products found for ${upc}.`;
    const it = items[0];
    return [
        `UPCitemdb lookup for ${upc} (${d.total ?? 0} results):`,
        `Title: ${it.title ?? '?'}`,
        `Brand: ${it.brand ?? '?'} | Category: ${it.category ?? '?'}`,
        `Description: ${(it.description ?? '').slice(0, 160) || 'n/a'}`,
        `Price range: ${it.lowest_recorded_price ?? '?'} - ${it.highest_recorded_price ?? '?'} USD`,
    ].filter(Boolean).join('\n');
}
// ---- muxF tools:
const UPC_HOST = 'https://api.upcitemdb.com/prod/trial/lookup';
function trimCodes(raw) {
    return (raw ?? '').trim().split(/[^0-9A-Za-z-]+/).map((c) => c.trim()).filter(Boolean);
}
async function trial(codes) {
    const res = await fetch(`${UPC_HOST}?upc=${encodeURIComponent(codes.join(','))}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`UPCitemdb returned ${res.status}`);
    const d = (await res.json());
    if (d.code && d.code !== 'OK')
        throw new Error(`UPCitemdb answered ${d.code}.`);
    return d;
}
/** Validate a barcode and take it apart: the check digit, the GS1 prefix, the item reference and the length class. */
export async function barcodeCheck(args) {
    const raw = (args.upc ?? '').trim();
    const codes = trimCodes(raw);
    if (!codes.length)
        return 'Provide a UPC-A, EAN-13, EAN-8 or UPC-E code to check.';
    const lines = ['Barcode structure check, computed locally against the GS1 check digit rule'];
    for (const code of codes.slice(0, 10)) {
        const digits = code.replace(/\D/g, '');
        if (!/^\d{6,14}$/.test(digits)) {
            lines.push(`${code}: not a run of 6 to 14 digits, so no check digit rule applies`);
            continue;
        }
        const stated = Number(digits[digits.length - 1]);
        const body = digits.slice(0, -1);
        let kind;
        let computed;
        let weightStart;
        if (digits.length === 12) {
            kind = 'UPC-A, equivalent to EAN-13 with a leading zero';
            weightStart = 0;
            computed = weighted(body, weightStart);
        }
        else if (digits.length === 13) {
            kind = 'EAN-13';
            weightStart = 1;
            computed = weighted(body, weightStart);
        }
        else if (digits.length === 8) {
            kind = 'EAN-8';
            weightStart = 0;
            computed = weighted(body, weightStart);
        }
        else {
            lines.push(`${code}: ${digits.length} digits is not one of the standard retail lengths (8, 12 or 13)`);
            continue;
        }
        const prefix = digits.slice(0, 3);
        const item = digits.slice(3, -1);
        lines.push(`${digits}: ${kind}`, `  check digit: stated ${stated}, computed ${computed}, ${stated === computed ? 'valid' : 'INVALID'}`, `  GS1 company prefix: ${prefix}${prefix === '978' || prefix === '979' ? ' (978 and 979 are the ISBN prefix range, so this is a book barcode)' : ''}`, `  item reference inside that prefix: ${item} (${item.length} digits)`, `  digits the check digit covers: ${body.length}`);
    }
    lines.push('The check digit is arithmetic, so this runs without a network call and without a database lookup.');
    return lines.join('\n');
}
function weighted(body, weightStart) {
    let sum = 0;
    for (let i = 0; i < body.length; i += 1) {
        sum += Number(body[i]) * ((i + weightStart) % 2 === 0 ? 3 : 1);
    }
    return (10 - (sum % 10)) % 10;
}
