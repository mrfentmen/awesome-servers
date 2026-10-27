import QRCode from "qrcode";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
export class QrError extends Error {
}
export async function generateQr(args) {
    const text = args.text ?? "";
    if (!text)
        throw new QrError("Provide text or a URL to encode");
    const size = Math.min(Math.max(args.size ?? 512, 128), 2048);
    const safe = /^[\w.\- ]+$/.test(args.filename ?? "") && args.filename.endsWith(".png")
        ? args.filename
        : `qr-${Date.now()}.png`;
    const dir = mkdtempSync(join(tmpdir(), "qr-"));
    const path = join(dir, safe);
    const png = await QRCode.toBuffer(text, { width: size, margin: 1, errorCorrectionLevel: "M" });
    writeFileSync(path, png);
    return `Created ${path} (${png.length} bytes, ${size}x${size})`;
}
// ---- muxE tools:
// The one existing tool encodes a payload and writes a PNG to a temporary file,
// and says nothing about whether the payload was a good fit for a QR code in the
// first place. What a scan of the result will actually do is the remaining gap:
// a bare string, a URL, a mailto, a tel and a wifi block are all encoded
// identically and a phone has to guess. The other two tools of this section,
// qr_capacity and qr_size_report, moved to the licence gateway (src/gateway.ts).
// Byte-mode ceilings per error correction level, in bytes. qrcode exports no
// capacity table, so these were obtained by binary searching the installed
// encoder for the largest payload it still accepts at each level, and all four
// came back matching the figures published for the specification: L 2953,
// M 2331, Q 1663, H 1273. The capacity tools that use every entry of this table
// moved to the licence gateway (src/gateway.ts); qr_analyse below still reads the
// M entry when it says whether a payload fits at the default level.
const CAPACITY_CACHE = { L: 2953, M: 2331, Q: 1663, H: 1273 };
// A payload is numeric, alphanumeric or byte, and the mode matters: a numeric
// phone number fits in far fewer modules than the same digits as text.
const NUMERIC = /^[0-9]*$/;
const ALNUM = /^[0-9A-Z $%*+\-./:]*$/;
const BYTE_ONLY = /[\x80-\uFFFF]/;
function modeOf(s) {
    if (!s.length)
        return { mode: 'empty', why: 'an empty payload encodes as a blank code' };
    if (BYTE_ONLY.test(s)) {
        return {
            mode: 'byte, forced',
            why: 'the payload contains a character outside Latin-1, so the encoder must fall back to full byte mode no matter what it looks like otherwise',
        };
    }
    if (NUMERIC.test(s))
        return { mode: 'numeric', why: 'digits only, the most compact mode available' };
    if (ALNUM.test(s))
        return { mode: 'alphanumeric', why: 'upper case letters, digits and a few symbols, so the compact alphanumeric mode applies' };
    return {
        mode: 'byte',
        why: 'lower case letters or punctuation are present, which the compact modes cannot represent, so this is encoded as bytes',
    };
}
export function qr_analyse(args) {
    const text = args?.text ?? '';
    if (!text)
        return Promise.reject(new QrError('Provide the text or URL you want to check'));
    const { mode, why } = modeOf(text);
    const bytes = Buffer.byteLength(text, 'utf8');
    const lines = [
        `What a scanner would do with this payload, and how it encodes:`,
        `  ${bytes} byte${bytes === 1 ? '' : 's'}, ${text.length} character${text.length === 1 ? '' : 's'}.`,
        `  encoding mode: ${mode}, because ${why}.`,
    ];
    // The scheme is what a phone acts on, and a bare string is the one case where
    // it has to guess, so that is called out rather than listed as just another
    // type.
    const trimmed = text.trim();
    const looks = (re, kind, what) => re.test(trimmed) ? kind : null;
    const kind = looks(/^https?:\/\//i, 'a web link', 'opens a browser at that address') ??
        looks(/^mailto:/i, 'an email address', 'opens a compose window with the recipient and subject filled in') ??
        looks(/^tel:/i, 'a telephone number', 'offers to dial it') ??
        looks(/^sms:/i, 'an SMS number', 'offers to start a text to it') ??
        looks(/^WIFI:/i, 'a saved wifi network', 'offers to join that network, and this is how guest wifi logins are usually done') ??
        looks(/^geo:/i, 'a location', 'opens a map at those coordinates') ??
        looks(/^BEGIN:VCARD/i, 'a contact card', 'offers to save the contact') ??
        looks(/^\/?[\w.-]+\.(png|jpg|jpeg|gif|svg|pdf|mp4|mp3)$/i, 'a file name or path', 'may be treated as a file, but a bare name has no host so most scanners will not fetch it') ??
        looks(/^[A-Z]:\\|^\\\\/i, 'a Windows or UNC path', 'has no protocol, so a phone will show the text rather than open it') ??
        looks(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i, 'a bare email address', 'is usually detected as an address, but a mailto prefix is unambiguous') ??
        looks(/^\+?[\d\s().-]{7,}$/i, 'digits that look like a phone number', 'is usually detected, but a tel prefix is unambiguous') ??
        null;
    if (kind) {
        // What the scanner does with it is the part a caller cannot see from the
        // encoded image, so each recognised form is paired with its consequence.
        const what = kind === 'a web link' ? 'opens a browser at that address' :
            kind === 'an email address' ? 'opens a compose window with the recipient and subject filled in' :
                kind === 'a telephone number' ? 'offers to dial it' :
                    kind === 'an SMS number' ? 'offers to start a text to it' :
                        kind === 'a saved wifi network' ? 'offers to join that network, which is how guest wifi logins are usually done' :
                            kind === 'a location' ? 'opens a map at those coordinates' :
                                kind === 'a contact card' ? 'offers to save the contact' :
                                    kind === 'a file name or path' ? 'may be treated as a file, though a bare name has no host so most scanners will not fetch it' :
                                        kind === 'a Windows or UNC path' ? 'has no protocol, so a phone will show the text rather than open it' :
                                            kind === 'a bare email address' ? 'is usually detected as an address, though a mailto prefix would be unambiguous' :
                                                'is usually detected as a number, though a tel prefix would be unambiguous';
        lines.push(`  a scanner will read this as ${kind}, and what it does with it: ${what}.`);
    }
    else {
        lines.push('  a scanner will read this as plain text, because there is no scheme for it to act on, and will show the string as-is.');
        lines.push('    If it is meant to be a link, a mailto, a tel or a wifi credential, it needs that prefix, otherwise the device has to guess and many will not.');
    }
    const cap = CAPACITY_CACHE.M;
    if (bytes > cap) {
        lines.push('');
        lines.push(`  It will not fit in a QR code at the default level M, which caps at ${cap.toLocaleString('en-US')} bytes. Use qr_capacity for the ceilings.`);
    }
    const query = /[?&=]/.test(trimmed) && /^https?:\/\//i.test(trimmed);
    if (query) {
        lines.push('');
        lines.push('  The link carries a query string, which costs more bytes than the visible text suggests, and a QR code holding a tracking link is not shorter just because the label on it is.');
    }
    const spaces = (trimmed.match(/ /g) ?? []).length;
    if (spaces > 4) {
        lines.push('');
        lines.push(`  It contains ${spaces} spaces, which are allowed in a QR code but tell no scanner anything. A URL with percent encoding instead of spaces is shorter and safer.`);
    }
    if (Buffer.byteLength(trimmed, 'utf8') < bytes) {
        lines.push('');
        lines.push(`  Leading or trailing whitespace adds ${bytes - Buffer.byteLength(trimmed, 'utf8')} byte(s) to the payload and is encoded, though no scanner will see it.`);
    }
    return Promise.resolve(lines.join('\n'));
}
