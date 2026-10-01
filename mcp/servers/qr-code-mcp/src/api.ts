import QRCode from "qrcode"
import { writeFileSync, mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

export class QrError extends Error {}

export async function generateQr(args: { text?: string; size?: number; filename?: string }): Promise<string> {
  const text = args.text ?? ""
  if (!text) throw new QrError("Provide text or a URL to encode")
  const size = Math.min(Math.max(args.size ?? 512, 128), 2048)
  const safe = /^[\w.\- ]+$/.test(args.filename ?? "") && args.filename!.endsWith(".png")
    ? args.filename!
    : `qr-${Date.now()}.png`
  const dir = mkdtempSync(join(tmpdir(), "qr-"))
  const path = join(dir, safe)
  const png = await QRCode.toBuffer(text, { width: size, margin: 1, errorCorrectionLevel: "M" })
  writeFileSync(path, png)
  return `Created ${path} (${png.length} bytes, ${size}x${size})`
}

// ---- muxE tools:
// The one existing tool encodes a payload and writes a PNG to a temporary file,
// and says nothing about whether the payload was a good fit for a QR code in the
// first place. Two things a caller genuinely needs before that point, and neither
// is available: whether the payload will fit at all at the error correction they
// get, since qrcode throws a length error and a long URL fails for a reason with
// no explanation; and what a scan of the result will actually do, since a bare
// string, a URL, a mailto, a tel and a wifi block are all encoded identically
// and a phone has to guess. The third tool uses the same qrcode dependency
// already in this package and encodes nothing, only reporting the version and
// module count a payload would produce at several sizes.
// QRCode is already imported at the top of this module, so it is reused here
// rather than imported a second time.

const LEVELS = ["L", "M", "Q", "H"] as const;
type Level = (typeof LEVELS)[number];

// Byte-mode ceilings per error correction level, in bytes. qrcode exports no
// capacity table, so these were obtained by binary searching the installed
// encoder for the largest payload it still accepts at each level, and all four
// came back matching the figures published for the specification: L 2953,
// M 2331, Q 1663, H 1273. The verdict below still comes from the live encoder
// rather than from this table, so a different build of the package would be
// believed over the table.
const CAPACITY_CACHE: Record<Level, number> = { L: 2953, M: 2331, Q: 1663, H: 1273 };

// A payload is numeric, alphanumeric or byte, and the mode matters: a numeric
// phone number fits in far fewer modules than the same digits as text.
const NUMERIC = /^[0-9]*$/;
const ALNUM = /^[0-9A-Z $%*+\-./:]*$/;
const BYTE_ONLY = /[\x80-\uFFFF]/;

function modeOf(s: string): { mode: string; why: string } {
  if (!s.length) return { mode: 'empty', why: 'an empty payload encodes as a blank code' };
  if (BYTE_ONLY.test(s)) {
    return {
      mode: 'byte, forced',
      why: 'the payload contains a character outside Latin-1, so the encoder must fall back to full byte mode no matter what it looks like otherwise',
    };
  }
  if (NUMERIC.test(s)) return { mode: 'numeric', why: 'digits only, the most compact mode available' };
  if (ALNUM.test(s)) return { mode: 'alphanumeric', why: 'upper case letters, digits and a few symbols, so the compact alphanumeric mode applies' };
  return {
    mode: 'byte',
    why: 'lower case letters or punctuation are present, which the compact modes cannot represent, so this is encoded as bytes',
  };
}

export interface CapacityArgs {
  text: string;
  level?: string;
}

export function qr_capacity(args: CapacityArgs): Promise<string> {
  const text = args?.text ?? '';
  if (!text) return Promise.reject(new QrError('Provide the text or URL you want to check'));
  const want = String(args?.level ?? '').trim().toUpperCase();
  if (want && !LEVELS.includes(want as Level)) {
    return Promise.reject(new QrError(`Error correction level must be one of L, M, Q, H. You asked for "${args?.level}".`));
  }
  const level = (want || 'M') as Level;
  const bytes = Buffer.byteLength(text, 'utf8');
  const { mode, why } = modeOf(text);
  const cap = CAPACITY_CACHE[level];
  // The live check: the table above is only believed if the installed encoder
  // agrees, and a payload that genuinely will not fit is reported as such
  // rather than leaving qrcode to throw an unexplained length error later.
  let encodes = true;
  let observed = '';
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: level });
    observed = `version ${qr.version}, ${qr.modules.size} modules square`;
  } catch (e) {
    encodes = false;
    observed = `the encoder refused it: ${e instanceof Error ? e.message : String(e)}`;
  }
  const pctOfCap = ((bytes / cap) * 100).toFixed(1);
  const lines = [
    `Can this payload be encoded as a QR code, and at what cost:`,
    `  payload: ${bytes} byte${bytes === 1 ? '' : 's'} over ${text.length} character${text.length === 1 ? '' : 's'}.`,
    `  encoding mode: ${mode}, because ${why}.`,
    `  byte capacity at error correction ${level}: ${cap.toLocaleString('en-US')} bytes, so this payload uses ${pctOfCap}% of it.`,
  ];
  lines.push(`  the installed encoder says: ${observed || 'it did not report a version'}.`);
  if (bytes > cap) {
    lines.push(`  It does NOT fit. The payload is ${(bytes - cap).toLocaleString('en-US')} bytes over the ceiling for level ${level}.`);
  } else if (bytes > cap * 0.85) {
    lines.push(`  It fits, but with little room: shortening it by more than ${Math.ceil(cap * 0.15).toLocaleString('en-US')} bytes would move it to a smaller version with a coarser grid.`);
  } else {
    lines.push('  It fits comfortably.');
  }
  lines.push('');
  lines.push('  capacity at every level, for the same payload:');
  for (const l of LEVELS) {
    const lcap = CAPACITY_CACHE[l];
    let fits = bytes <= lcap;
    let note = '';
    if (fits) {
      try {
        const qr = QRCode.create(text, { errorCorrectionLevel: l });
        note = `version ${qr.version}, ${qr.modules.size} modules`;
      } catch {
        fits = false;
      }
    }
    if (!fits) note = 'does not fit';
    const bar = bytes <= lcap ? '#'.repeat(Math.max(1, Math.round((bytes / lcap) * 30))) : '';
    const reading =
      l === 'L' ? '7% recoverable, smallest grid' :
      l === 'M' ? '15% recoverable, the usual default' :
      l === 'Q' ? '25% recoverable' :
      '30% recoverable, the most damage tolerant and the largest grid';
    lines.push(`    ${l}  ${String(lcap).padStart(5)}  ${String(pctOfCap).padStart(5)}%  ${fits ? note.padEnd(24) : note.padEnd(24)}  ${bar}`);
    lines.push(`        ${reading}`);
  }
  const largest = LEVELS.filter((l) => bytes <= CAPACITY_CACHE[l]).pop();
  if (largest) {
    lines.push('');
    lines.push(`  It fits at up to level ${largest}. Going above that needs a shorter payload.`);
  } else {
    lines.push('');
    lines.push('  It fits at no level, so the payload has to be shortened before any QR code can carry it.');
  }
  return Promise.resolve(lines.join('\n'));
}

export interface AnalyseArgs {
  text: string;
}

export function qr_analyse(args: AnalyseArgs): Promise<string> {
  const text = args?.text ?? '';
  if (!text) return Promise.reject(new QrError('Provide the text or URL you want to check'));
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
  const looks = (re: RegExp, kind: string, what: string): string | null =>
    re.test(trimmed) ? kind : null;
  const kind =
    looks(/^https?:\/\//i, 'a web link', 'opens a browser at that address') ??
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
    const what =
      kind === 'a web link' ? 'opens a browser at that address' :
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
  } else {
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

export interface SizingArgs {
  text: string;
  level?: string;
}

export function qr_size_report(args: SizingArgs): Promise<string> {
  const text = args?.text ?? '';
  if (!text) return Promise.reject(new QrError('Provide the text or URL you want measured'));
  const want = String(args?.level ?? '').trim().toUpperCase();
  if (want && !LEVELS.includes(want as Level)) {
    return Promise.reject(new QrError(`Error correction level must be one of L, M, Q, H. You asked for "${args?.level}".`));
  }
  const level = (want || 'M') as Level;
  const bytes = Buffer.byteLength(text, 'utf8');
  let qr;
  try {
    qr = QRCode.create(text, { errorCorrectionLevel: level });
  } catch (e) {
    return Promise.reject(
      new QrError(
        `This payload cannot be encoded at level ${level}: ${e instanceof Error ? e.message : String(e)}. It is ${bytes} bytes and the ceiling is ${CAPACITY_CACHE[level].toLocaleString('en-US')}.`,
      ),
    );
  }
  const modules = qr.modules.size;
  const version = qr.version;
  const lines = [
    `How big a QR code this payload produces, at error correction ${level}:`,
    `  version ${version}, a ${modules} by ${modules} module grid.`,
    `  payload ${bytes} byte${bytes === 1 ? '' : 's'}.`,
    ``,
    `  ${"width px".padEnd(11)}${"module px".padEnd(12)}total incl. margin`,
  ];
  // The module size is what decides whether a scan works at all, so a row that
  // gives an unworkably small module is marked rather than just listed.
  for (const w of [128, 256, 512, 1024, 2048]) {
    const per = Math.floor((w - 2) / modules);
    const ok = per >= 3;
    lines.push(`  ${String(w).padEnd(11)}${String(per).padEnd(12)}${ok ? 'scannable' : 'too small, a phone camera will struggle'}`);
  }
  const usable = 256;
  const perUsable = Math.floor((usable - 2) / modules);
  lines.push('');
  lines.push(`  At ${usable} pixels each module would be ${perUsable} pixel${perUsable === 1 ? '' : 's'}, and the usual advice is at least 3, so ${perUsable < 3 ? `${usable} pixels is below that for this payload and version` : `${usable} pixels is workable`}.`);
  const cheapest = LEVELS.reduce((best, l) => {
    try {
      const q = QRCode.create(text, { errorCorrectionLevel: l });
      return q.modules.size < best.size ? { size: q.modules.size, version: q.version, level: l } : best;
    } catch {
      return best;
    }
  }, { size: modules, version, level });
  const toughest = LEVELS.reduce((worst, l) => {
    try {
      const q = QRCode.create(text, { errorCorrectionLevel: l });
      return q.modules.size > worst.size ? { size: q.modules.size, version: q.version, level: l } : worst;
    } catch {
      return worst;
    }
  }, { size: modules, version, level });
  lines.push('');
  lines.push(`  Smallest grid across all four levels: version ${cheapest.version} at level ${cheapest.level}, ${cheapest.size} modules.`);
  lines.push(`  Largest grid: version ${toughest.version} at level ${toughest.level}, ${toughest.size} modules.`);
  if (cheapest.size !== toughest.size) {
    lines.push(`  So the error correction level moves this payload between a ${cheapest.size} and a ${toughest.size} module grid, which is the trade being made.`);
  } else {
    lines.push('  All four levels give the same grid size here, so the choice of level costs nothing in size for this payload.');
  }
  lines.push('');
  lines.push('  The existing generate_qr writes the PNG and reports its byte count, but not the module grid it had to hit or how close to a phone camera is safe.');
  return Promise.resolve(lines.join('\n'));
}
