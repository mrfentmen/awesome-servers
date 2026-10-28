/**
 * Hash Identifier — keyless public API client.
 */
export class SourceError extends Error {
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
const RULES = [
    { name: "bcrypt", test: /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/, mode: "3200" },
    { name: "argon2", test: /^\$argon2(?:id|i|d)\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/, note: "no common hashcat mode; use argon2-aware tools" },
    { name: "scrypt", test: /^\$scrypt\$[A-Za-z0-9+/=,$*]+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/, mode: "8900" },
    { name: "sha512crypt (crypt)", test: /^\$6\$(?:rounds=\d+\$)?[./A-Za-z0-9]{0,16}\$[./A-Za-z0-9]{86}$/, mode: "1800" },
    { name: "sha256crypt (crypt)", test: /^\$5\$(?:rounds=\d+\$)?[./A-Za-z0-9]{0,16}\$[./A-Za-z0-9]{43}$/, mode: "7400" },
    { name: "md5crypt (crypt)", test: /^\$1\$[./A-Za-z0-9]{0,8}\$[./A-Za-z0-9]{22}$/, mode: "500" },
    { name: "phpass (WordPress)", test: /^\$P\$[./A-Za-z0-9]{31}$/, mode: "400" },
    { name: "Drupal 7", test: /^\$S\$[./A-Za-z0-9]{52}$/, mode: "7900" },
    { name: "JWT", test: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/, note: "three base64url parts; decode with jwt-mcp" },
    { name: "UUID", test: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, note: "not a hash, but often confused with one" },
    { name: "MySQL 4.1+ native", test: /^\*[A-F0-9]{40}$/, mode: "300" },
    { name: "PostgreSQL md5", test: /^md5[0-9a-f]{32}$/, mode: "12" },
    { name: "md5 / md4 / NTLM / LM (hex)", test: /^[a-f0-9]{32}$/, mode: "0 (md5) / 900 (md4) / 1000 (NTLM)" },
    { name: "sha1 / ripemd160 / MySQL 4.1 (40 hex)", test: /^[a-f0-9]{40}$/, mode: "100 (sha1) / 6000 (ripemd160)" },
    { name: "sha224", test: /^[a-f0-9]{56}$/, mode: "1300" },
    { name: "sha256 / sha3-256 / keccak-256 / blake2s (64 hex)", test: /^[a-f0-9]{64}$/, mode: "1400 (sha256) / 17400 (sha3-256)" },
    { name: "sha384", test: /^[a-f0-9]{96}$/, mode: "10800" },
    { name: "sha512 / whirlpool (128 hex)", test: /^[a-f0-9]{128}$/, mode: "1700 (sha512) / 6100 (whirlpool)" },
    { name: "CRC32", test: /^[a-f0-9]{8}$/, mode: "11500" },
    { name: "CRC16", test: /^[a-f0-9]{4}$/, mode: "no common mode" },
    { name: "base64 (16 bytes)", test: /^[A-Za-z0-9+/]{22}==$/, note: "22 chars + == is 16 bytes; could wrap any 16-byte hash" },
    { name: "base64 (32 bytes)", test: /^[A-Za-z0-9+/]{43}=$/, note: "43 chars + = is 32 bytes" },
];
const LENGTHS = [
    ["CRC16", 4, "no common mode"],
    ["CRC32", 8, "11500"],
    ["md5 / NTLM / md4", 32, "0 / 1000 / 900"],
    ["sha1 / ripemd160", 40, "100 / 6000"],
    ["sha224", 56, "1300"],
    ["sha256 / sha3-256", 64, "1400 / 17400"],
    ["sha384", 96, "10800"],
    ["sha512 / whirlpool", 128, "1700 / 6100"],
];
export async function identifyHash(a) {
    const text = clean(a.text);
    if (!text)
        throw new SourceError("give the hash text to identify");
    const hits = RULES.filter((r) => r.test.test(text));
    if (!hits.length) {
        return [
            "No known hash format matches this string.",
            "",
            `Length: ${text.length} characters · all hex: ${/^[a-fA-F0-9]+$/.test(text)}`,
            "If it is a hex digest, check the length table with hash_lengths; unusual lengths often mean base64 or a salted format.",
        ].join("\n");
    }
    return [
        `${hits.length} possible match(es) for a ${text.length}-character string:`,
        "",
        ...hits.map((r) => {
            const bits = [r.mode ? `hashcat mode ${r.mode}` : "", r.note ?? ""].filter(Boolean);
            return `- ${r.name}${bits.length ? ` · ${bits.join(" · ")}` : ""}`;
        }),
        hits.length > 1 ? "\nSeveral formats share a shape; the exact one needs context (a prefix, a length table or the source system)." : "",
    ].filter(Boolean).join("\n");
}
export async function hashLengths() {
    return [
        "Common hex digest lengths:",
        "",
        "algorithm                    hex chars  hashcat mode",
        ...LENGTHS.map(([name, len, mode]) => `${name.padEnd(28)} ${String(len).padStart(9)}  ${mode}`),
        "",
        "Password hashes (bcrypt, argon2, crypt formats) carry their own fixed layouts - use identify_hash or hash_details on a sample.",
    ].join("\n");
}
const CRYPT_NAMES = { "1": "md5crypt", "5": "sha256crypt", "6": "sha512crypt" };
const CRYPT_MODES = { "1": "500", "5": "7400", "6": "1800" };
export async function hashDetails(a) {
    const text = clean(a.text);
    if (!text)
        throw new SourceError("give a password hash string to inspect");
    if (/^\$2[abxy]\$/.test(text)) {
        const m = text.match(/^\$2([abxy])\$(\d{2})\$([./A-Za-z0-9]{22})([./A-Za-z0-9]{31})$/);
        if (!m)
            throw new SourceError("this looks like bcrypt but the layout is off (expected $2b$cost$22-char-salt+31-char-hash)");
        const cost = Number(m[2]);
        return [
            "bcrypt",
            "",
            `version: 2${m[1]}`,
            `cost factor: ${cost} (2^${cost} = ${2 ** cost} key expansions per guess; ${cost < 10 ? "weak by today's standards" : cost >= 12 ? "strong" : "acceptable"})`,
            `salt (22 chars, base64): ${m[3]}`,
            `hash (31 chars): ${m[4]}`,
            "",
            "hashcat mode 3200; the input for cracking is hash:salt or the full string depending on the tool.",
        ].join("\n");
    }
    if (/^\$argon2/.test(text)) {
        const m = text.match(/^\$argon2(id|i|d)\$v=(\d+)\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/=]+)\$([A-Za-z0-9+/=]+)$/);
        if (!m)
            throw new SourceError("this looks like argon2 but the parameter block is malformed");
        return [
            `argon2${m[1]}`,
            "",
            `version: ${m[2]}`,
            `memory: ${m[3]} KiB`,
            `iterations: ${m[4]}`,
            `parallelism: ${m[5]}`,
            `salt (base64): ${m[6]}`,
            `hash (base64): ${m[7]}`,
            "",
            "No common hashcat mode; use argon2-aware tools and keep memory cost high.",
        ].join("\n");
    }
    if (/^\$[156]\$/.test(text)) {
        const m = text.match(/^\$([156])\$(rounds=(\d+)\$)?([./A-Za-z0-9]{0,16})\$(.+)$/);
        if (!m)
            throw new SourceError("this looks like a crypt hash but the layout is off");
        const family = CRYPT_NAMES[m[1]] ?? "crypt";
        return [
            family,
            "",
            `rounds: ${m[3] ?? "default (5000)"}`,
            `salt: ${m[4] || "(empty)"}`,
            `digest (${m[5].length} chars): ${m[5].slice(0, 40)}${m[5].length > 40 ? "..." : ""}`,
            "",
            `hashcat mode ${CRYPT_MODES[m[1]] ?? "varies"}`,
        ].join("\n");
    }
    const hits = RULES.filter((r) => r.test.test(text));
    if (!hits.length)
        throw new SourceError("this string does not match a known password-hash format");
    return [
        `Plain hash format(s): ${hits.map((h) => h.name).join(", ")}`,
        "",
        `Length: ${text.length} characters`,
        "For a plain digest there are no embedded parameters; identify_hash and hash_lengths cover the interpretation.",
    ].join("\n");
}
