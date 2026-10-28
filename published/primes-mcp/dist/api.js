/**
 * Primes — keyless public API client.
 */
export class SourceError extends Error {
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
function parseBig(text, label, max) {
    const value = clean(text).replace(/_/g, "");
    let parsed;
    try {
        parsed = /^-?0x[0-9a-f]+$/i.test(value) ? BigInt(value) : BigInt(value);
    }
    catch {
        throw new SourceError(`${label} must be a decimal or 0x-hex whole number, got "${text}"`);
    }
    if (parsed < 0n)
        throw new SourceError(`${label} must not be negative`);
    if (parsed > max)
        throw new SourceError(`${label} is capped at ${max}`);
    return parsed;
}
function modPow(base, exp, mod) {
    let result = 1n;
    let b = base % mod;
    let e = exp;
    while (e > 0n) {
        if (e & 1n)
            result = (result * b) % mod;
        b = (b * b) % mod;
        e >>= 1n;
    }
    return result;
}
// Miller-Rabin. The first twelve prime bases are deterministic below 3.3e24.
const BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
function isPrimeBig(n) {
    if (n < 2n)
        return false;
    for (const small of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
        if (n === small)
            return true;
        if (n % small === 0n)
            return false;
    }
    let d = n - 1n;
    let r = 0;
    while (d % 2n === 0n) {
        d /= 2n;
        r++;
    }
    for (const a of BASES) {
        let x = modPow(a, d, n);
        if (x === 1n || x === n - 1n)
            continue;
        let composite = true;
        for (let i = 1; i < r; i++) {
            x = (x * x) % n;
            if (x === n - 1n) {
                composite = false;
                break;
            }
        }
        if (composite)
            return false;
    }
    return true;
}
function gcd(a, b) {
    while (b) {
        const t = a % b;
        a = b;
        b = t;
    }
    return a;
}
function pollardRho(n) {
    if (n % 2n === 0n)
        return 2n;
    let c = 1n;
    for (;;) {
        let x = 2n;
        let y = 2n;
        let d = 1n;
        const f = (v) => (v * v + c) % n;
        while (d === 1n) {
            x = f(x);
            y = f(f(y));
            d = gcd(x > y ? x - y : y - x, n);
        }
        if (d !== n)
            return d;
        c++;
    }
}
function factor(n, out) {
    if (n === 1n)
        return;
    if (isPrimeBig(n)) {
        out.push(n);
        return;
    }
    const d = pollardRho(n);
    factor(d, out);
    factor(n / d, out);
}
export async function isPrime(a) {
    const n = parseBig(a.n, "n", 10n ** 100n);
    if (n > 10n ** 30n)
        throw new SourceError("n is capped at 10^30 for a deterministic answer");
    const prime = isPrimeBig(n);
    return [
        `${n} is ${prime ? "prime" : "not prime"}.`,
        "",
        n < 2n ? "0 and 1 are not prime by definition." : prime ? "Miller-Rabin with twelve fixed bases is deterministic in this range." : "The test found a witness that proves compositeness.",
        bullet("digits", n.toString().length),
    ]
        .filter(Boolean)
        .join("\n");
}
export async function factorise(a) {
    const n = parseBig(a.n, "n", 10n ** 24n);
    if (n < 2n)
        throw new SourceError("n must be 2 or more");
    const factors = [];
    let rest = n;
    for (const small of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n]) {
        while (rest % small === 0n) {
            factors.push(small);
            rest /= small;
        }
    }
    factor(rest, factors);
    factors.sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
    const grouped = new Map();
    for (const f of factors)
        grouped.set(f.toString(), (grouped.get(f.toString()) ?? 0) + 1);
    const pretty = Array.from(grouped.entries())
        .map(([prime, power]) => (power === 1 ? prime : `${prime}^${power}`))
        .join(" x ");
    const distinct = grouped.size;
    return [
        `${n} = ${pretty}`,
        "",
        bullet("prime factors", factors.length),
        bullet("distinct primes", distinct),
        bullet("the number is", distinct === 1 && factors.length === 1 ? "prime" : "composite"),
    ]
        .filter(Boolean)
        .join("\n");
}
export async function primesInRange(a) {
    const from = Math.max(0, Math.floor(a.from));
    const to = Math.floor(a.to);
    if (!Number.isFinite(from) || !Number.isFinite(to))
        throw new SourceError("from and to must be numbers");
    if (to < from)
        throw new SourceError("to must be at least from");
    if (to > 20_000_000)
        throw new SourceError("to is capped at 20000000");
    if (to - from > 5_000_000)
        throw new SourceError("the span is capped at 5000000 numbers");
    const limit = clampLimit(a.limit, 50, 1000);
    if (to < 2)
        return `No primes between ${from} and ${to}.`;
    const size = to - from + 1;
    const sieve = new Uint8Array(size).fill(1);
    const limitSqrt = Math.floor(Math.sqrt(to));
    const baseSieve = new Uint8Array(limitSqrt + 1).fill(1);
    for (let i = 2; i * i <= limitSqrt; i++) {
        if (baseSieve[i])
            for (let j = i * i; j <= limitSqrt; j += i)
                baseSieve[j] = 0;
    }
    for (let p = 2; p <= limitSqrt; p++) {
        if (!baseSieve[p])
            continue;
        const start = Math.max(p * p, Math.ceil(from / p) * p);
        for (let j = start; j <= to; j += p)
            sieve[j - from] = 0;
    }
    if (from <= 1)
        sieve[Math.max(0, 1 - from)] = from <= 1 ? 0 : sieve[Math.max(0, 1 - from)];
    const primes = [];
    let count = 0;
    for (let i = 0; i < size; i++) {
        if (sieve[i]) {
            count++;
            if (primes.length < limit)
                primes.push(from + i);
        }
    }
    if (!count)
        return `No primes between ${from} and ${to}.`;
    return [
        `${count} prime(s) between ${from} and ${to}${count > primes.length ? `, first ${primes.length}` : ""}:`,
        "",
        ...primes,
        count > primes.length ? `... and ${count - primes.length} more.` : "",
    ]
        .filter(Boolean)
        .join("\n");
}
export async function nextPrime(a) {
    let n = parseBig(a.n, "n", 10n ** 30n);
    let candidate = n + 1n;
    let steps = 0;
    while (!isPrimeBig(candidate)) {
        candidate++;
        steps++;
        if (steps > 20000)
            throw new SourceError("no prime found within 20000 steps — try a smaller number");
    }
    return [
        `The next prime after ${n} is ${candidate}.`,
        "",
        bullet("steps", steps),
        bullet("gap", candidate - n),
    ]
        .filter(Boolean)
        .join("\n");
}
