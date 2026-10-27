// ---- muxB tools:
const MAX_CANDIDATES = 50;
const MAX_CANDIDATE_LENGTH = 4096;
const MAX_TEXT = 200000;
const FAMILIES = [
    { name: "private-key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
    { name: "cloud-key", pattern: /AKIA[0-9A-Z]{16}/g },
    { name: "token-assignment", pattern: /\b(?:token|secret|password|api[_-]?key)\s*[:=]\s*(?:["'][^"']{8,}["']|[^\s#]{8,})/gi },
    { name: "bearer", pattern: /Bearer\s+([A-Za-z0-9._-]{12,})/g },
    { name: "literal-blob", pattern: /["']([A-Za-z0-9+/=_-]{24,})["']/g },
    { name: "credentials-in-url", pattern: /[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:([^/\s:@]{3,})@/gi },
    { name: "webhook-url", pattern: /https?:\/\/(?:hooks|discord|outlook)\.[^\s"']{6,}/g },
];
function pad(label, width = 18) {
    return label.length >= width ? label : label + " ".repeat(width - label.length);
}
function shannonBits(value) {
    if (!value.length)
        return 0;
    const counts = new Map();
    for (const character of value)
        counts.set(character, (counts.get(character) ?? 0) + 1);
    let entropy = 0;
    for (const count of counts.values()) {
        const share = count / value.length;
        entropy -= share * Math.log2(share);
    }
    return entropy;
}
function composition(value) {
    const out = { lower: 0, upper: 0, digit: 0, symbol: 0 };
    for (const character of value) {
        if (/[a-z]/.test(character))
            out.lower += 1;
        else if (/[A-Z]/.test(character))
            out.upper += 1;
        else if (/[0-9]/.test(character))
            out.digit += 1;
        else
            out.symbol += 1;
    }
    return out;
}
function shapeOf(value) {
    const classes = [...value].map((character) => (/[a-z]/.test(character) ? "l" : /[A-Z]/.test(character) ? "u" : /[0-9]/.test(character) ? "d" : "s"));
    const runs = [];
    for (const symbol of classes) {
        const last = runs[runs.length - 1];
        if (last && last[0] === symbol)
            last[1] += 1;
        else
            runs.push([symbol, 1]);
    }
    const rendered = runs.map(([symbol, count]) => `${symbol}${count > 1 ? count : ""}`).join("");
    return rendered.length > 40 ? `${rendered.slice(0, 40)}...` : rendered;
}
function bandOf(bits, length) {
    if (length < 12)
        return "too-short";
    if (bits < 2)
        return "low-entropy";
    if (bits < 3)
        return "moderate";
    if (bits < 3.6)
        return "strong";
    return "very-strong";
}
export async function secretExposureLedger(args) {
    const text = args.text ?? "";
    if (!text.trim())
        throw new Error("Provide text to run a redacted exposure ledger over");
    if (text.length > MAX_TEXT)
        throw new Error(`Keep text under ${MAX_TEXT} characters`);
    const out = [];
    const ledger = [];
    let total = 0;
    const familiesHit = [];
    for (const family of FAMILIES) {
        family.pattern.lastIndex = 0;
        const seen = new Map();
        let count = 0;
        let match;
        while ((match = family.pattern.exec(text)) !== null && count < 40) {
            const captured = match[1] ?? match[0];
            count += 1;
            total += 1;
            seen.set(captured, (seen.get(captured) ?? 0) + 1);
            if (ledger.length < 24)
                ledger.push(`  ${family.name} #${count}: length ${captured.length}, shape ${shapeOf(captured)}`);
        }
        if (count)
            familiesHit.push(`${family.name}=${count}`);
    }
    const repeatTotal = [...FAMILIES].reduce((sum, family) => {
        family.pattern.lastIndex = 0;
        let duplicates = 0;
        const values = new Set();
        let match;
        while ((match = family.pattern.exec(text)) !== null && values.size < 2000) {
            const captured = match[1] ?? match[0];
            if (values.has(captured))
                duplicates += 1;
            values.add(captured);
        }
        return sum + duplicates;
    }, 0);
    out.push(`Redacted secret exposure ledger (${text.length} characters scanned, ${total} pattern hits)`);
    out.push(`${pad("Families")}${familiesHit.length ? familiesHit.join("  ") : "no pattern family matched"}`);
    out.push("Match ledger - lengths and character-class shapes only, never values:");
    if (ledger.length)
        for (const row of ledger)
            out.push(row);
    else
        out.push("  no matches to describe");
    if (total > ledger.length)
        out.push(`  +${total - ledger.length} further matches not listed`);
    out.push(`${pad("Duplicates")}${repeatTotal} match occurrence${repeatTotal === 1 ? "" : "s"} repeat a value already seen, so distinct-value count is below the hit count`);
    out.push(`${pad("Verdict")}${total === 0 ? "clear - no secret-shaped pattern found" : repeatTotal > 0 ? "review-and-rotate - the same secret appears more than once" : "review-and-rotate - a secret-shaped pattern is present"}`);
    out.push("Secret values, keys, paths, filenames, source lines and offsets are never returned.");
    return out.join("\n");
}
