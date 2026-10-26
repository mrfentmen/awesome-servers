export class PinataError extends Error {
}
// ---- muxH tools:
// A CID is self-describing: the multibase prefix says how it is encoded, and
// what follows is a version, a multicodec, a multihash function and a digest.
// These tools decode that structure locally, so a CID can be checked, compared
// and re-encoded without calling a pinning service.
const B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const B32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";
const MULTICODECS = {
    0x55: "raw",
    0x70: "dag-pb",
    0x71: "dag-cbor",
    0x72: "libp2p-key",
    0x78: "git-raw",
    0x7b: "torrent-info",
    0x0129: "file",
    0x0290: "raw-leaves",
};
const MULTIHASHES = {
    0x11: "sha1",
    0x12: "sha2-256",
    0x13: "sha2-512",
    0x14: "sha3-512",
    0x15: "sha3-384",
    0x16: "sha3-256",
    0x17: "shake-128",
    0x18: "shake-256",
    0x1b: "keccak-256",
    0x1c: "blake2b-256",
    0x1d: "blake2s-256",
    0x22: "murmur3-128",
    0x56: "dbl-sha2-256",
};
function decodeBase32(input) {
    let bits = 0;
    let value = 0;
    const out = [];
    for (const char of input) {
        const index = B32_ALPHABET.indexOf(char);
        if (index < 0)
            throw new PinataError(`"${char}" is not a base32 (RFC 4648 lowercase) character.`);
        value = (value << 5) | index;
        bits += 5;
        while (bits >= 8) {
            out.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    return Buffer.from(out);
}
function decodeBase58(input) {
    let value = 0n;
    for (const char of input) {
        const index = B58_ALPHABET.indexOf(char);
        if (index < 0)
            throw new PinataError(`"${char}" is not a base58 (bitcoin alphabet) character.`);
        value = value * 58n + BigInt(index);
    }
    const out = [];
    while (value > 0n) {
        out.unshift(Number(value & 0xffn));
        value >>= 8n;
    }
    for (const char of input) {
        if (char !== B58_ALPHABET[0])
            break;
        out.unshift(0);
    }
    return Buffer.from(out);
}
function encodeBase32(buffer) {
    let bits = 0;
    let value = 0;
    let out = "";
    for (const byte of buffer) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            out += B32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
            bits -= 5;
        }
    }
    if (bits > 0)
        out += B32_ALPHABET[(value << (5 - bits)) & 0x1f];
    return out;
}
function encodeBase58(buffer) {
    let value = 0n;
    for (const byte of buffer)
        value = (value << 8n) | BigInt(byte);
    let out = "";
    while (value > 0n) {
        out = B58_ALPHABET[Number(value % 58n)] + out;
        value /= 58n;
    }
    for (const byte of buffer) {
        if (byte !== 0)
            break;
        out = B58_ALPHABET[0] + out;
    }
    return out;
}
function readVarint(buffer, offset) {
    let result = 0n;
    let shift = 0n;
    let index = offset;
    for (;;) {
        if (index >= buffer.length)
            throw new PinataError("Truncated varint: the CID ends in the middle of a number.");
        const byte = buffer[index++];
        result |= BigInt(byte & 0x7f) << shift;
        if ((byte & 0x80) === 0)
            break;
        shift += 7n;
        if (shift > 63n)
            throw new PinataError("Varint is longer than any multicodec or hash code.");
    }
    return [result, index];
}
function encodeVarint(value) {
    const out = [];
    let rest = value;
    do {
        const byte = rest & 0x7f;
        rest >>>= 7;
        out.push(rest > 0 ? byte | 0x80 : byte);
    } while (rest > 0);
    return Buffer.from(out);
}
const shorten = (text, limit = 56) => (text.length > limit ? `${text.slice(0, limit)}…` : text);
function decodeCid(input) {
    const text = (input ?? "").trim();
    if (!text)
        throw new PinataError("Give a CID to decode.");
    let buffer;
    let multibase;
    if (text[0] === "Q") {
        buffer = decodeBase58(text);
        multibase = "base58btc, no multibase prefix";
    }
    else if (text[0] === "b") {
        buffer = decodeBase32(text.slice(1));
        multibase = "base32 lower, multibase prefix b";
    }
    else if (text[0] === "z") {
        buffer = decodeBase58(text.slice(1));
        multibase = "base58btc, multibase prefix z";
    }
    else {
        throw new PinataError(`Unsupported multibase prefix "${text[0]}". This tool reads base58btc (Q..., z...) and base32 lower (b...).`);
    }
    let version = 0;
    let codecCode = 0x70;
    let cursor = 0;
    if (buffer[0] === 0x01) {
        version = 1;
        const [codec, after] = readVarint(buffer, 1);
        codecCode = Number(codec);
        cursor = after;
    }
    const [hashCode, afterHash] = readVarint(buffer, cursor);
    const [lengthCode, afterLength] = readVarint(buffer, afterHash);
    const length = Number(lengthCode);
    const digest = buffer.subarray(afterLength, afterLength + length);
    if (digest.length !== length) {
        throw new PinataError(`Truncated CID: the header declares a ${length}-byte digest but only ${digest.length} bytes follow.`);
    }
    return {
        text,
        version,
        multibase,
        codecCode,
        codec: MULTICODECS[codecCode] ?? `unknown multicodec 0x${codecCode.toString(16)}`,
        hashCode: Number(hashCode),
        hash: MULTIHASHES[Number(hashCode)] ?? `unknown multihash 0x${Number(hashCode).toString(16)}`,
        digest: Buffer.from(digest),
        multihash: buffer.subarray(cursor),
    };
}
/**
 * Re-encode one CID into another form, copying the multihash bytes unchanged,
 * so a v0 and its v1 equivalent can be compared or pasted side by side.
 */
export async function convertCid(args) {
    const target = (args.to ?? "").trim().toLowerCase();
    if (!["v0", "v1", "base32", "base58"].includes(target)) {
        throw new PinataError("to must be one of: v0, v1, base32, base58.");
    }
    const cid = decodeCid(args.cid);
    const v1Body = Buffer.concat([Buffer.from([0x01]), encodeVarint(cid.codecCode), cid.multihash]);
    const v0Body = cid.multihash;
    const rows = [];
    if (target === "v0" || target === "base58") {
        rows.push(`  as CIDv0 / base58btc:  ${encodeBase58(v0Body)}`);
    }
    if (target === "v1" || target === "base32") {
        rows.push(`  as CIDv1 / base32:     b${encodeBase32(v1Body)}`);
    }
    const roundTrip = decodeCid(target === "v0" || target === "base58" ? encodeBase58(v0Body) : `b${encodeBase32(v1Body)}`);
    return [
        `CID re-encoding: ${shorten(cid.text, 60)}`,
        `  source   v${cid.version}, ${cid.codec} over ${cid.hash}, ${cid.digest.length}-byte digest`,
        ...rows,
        "",
        `  reading back the ${target === "v0" || target === "base58" ? "CIDv0" : "CIDv1"} form gives v${roundTrip.version}, ${roundTrip.codec} over ${roundTrip.hash}.`,
        "The multihash bytes are copied unchanged; only the framing and encoding differ.",
    ].join("\n");
}
