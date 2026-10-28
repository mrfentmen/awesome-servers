/**
 * Combinatorics — keyless public API client.
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
function parseInt10(text, label) {
    const value = Number(clean(text));
    if (!Number.isInteger(value) || value < 0)
        throw new SourceError(`${label} must be a non-negative whole number`);
    return value;
}
function bigText(value, cap = 2000) {
    const text = value.toString();
    return text.length > cap ? `${text.slice(0, cap)}... (${text.length} digits)` : text;
}
function factorial(n) {
    let acc = 1n;
    for (let i = 2n; i <= BigInt(n); i++)
        acc *= i;
    return acc;
}
export async function factorialOf(a) {
    const n = parseInt10(String(a.n), "n");
    if (n > 5000)
        throw new SourceError("n is capped at 5000 — that result has about 16,000 digits");
    const value = factorial(n);
    return [
        `${n}! =`,
        "",
        bigText(value),
        "",
        bullet("digits", value.toString().length),
        bullet("trailing zeros", n === 0 ? 0 : Math.floor(n / 5) + Math.floor(n / 25) + Math.floor(n / 125) + Math.floor(n / 625) + Math.floor(n / 3125)),
    ]
        .filter(Boolean)
        .join("\n");
}
export async function chooseNumbers(a) {
    const n = parseInt10(String(a.n), "n");
    const r = parseInt10(String(a.r), "r");
    const kind = a.kind === "permutations" ? "permutations" : "combinations";
    if (n > 100000)
        throw new SourceError("n is capped at 100000");
    if (r > n)
        throw new SourceError("r cannot be larger than n");
    const pick = kind === "permutations" ? Math.min(r, n - r) : Math.min(r, n - r);
    let value = 1n;
    if (kind === "combinations") {
        for (let i = 0; i < pick; i++)
            value = (value * BigInt(n - i)) / BigInt(i + 1);
    }
    else {
        for (let i = 0; i < r; i++)
            value *= BigInt(n - i);
    }
    return [
        `${kind === "combinations" ? "C" : "P"}(${n}, ${r}) =`,
        "",
        bigText(value),
        "",
        bullet("digits", value.toString().length),
        bullet("formula", kind === "combinations" ? "n! / (r! (n-r)!)" : "n! / (n-r)!"),
    ]
        .filter(Boolean)
        .join("\n");
}
export async function fibonacciOf(a) {
    const n = parseInt10(String(a.n), "n");
    if (n > 20000)
        throw new SourceError("n is capped at 20000 — that result has about 4,180 digits");
    let aPrev = 0n;
    let current = 1n;
    for (let i = 1; i <= n; i++) {
        const next = aPrev + current;
        aPrev = current;
        current = next;
    }
    const value = n === 0 ? 0n : aPrev;
    return [
        `F(${n}) =`,
        "",
        bigText(value),
        "",
        bullet("digits", value.toString().length),
        bullet("F(n-1)", n > 0 ? bigText(aPrev === value ? 0n : current - value, 200) : "n/a"),
    ]
        .filter(Boolean)
        .join("\n");
}
function itemsFrom(value) {
    const items = value.split(",").map((v) => v.trim()).filter(Boolean);
    if (!items.length)
        throw new SourceError("give a comma-separated list of items");
    if (items.length > 12)
        throw new SourceError("at most 12 items");
    return items;
}
export async function permutationsOf(a) {
    const items = itemsFrom(a.items);
    if (items.length > 8)
        throw new SourceError("permutations are capped at 8 items (40,320 results)");
    const limit = clampLimit(a.limit, 50, 500);
    const out = [];
    const used = new Array(items.length).fill(false);
    const current = [];
    const walk = () => {
        if (out.length >= limit)
            return;
        if (current.length === items.length) {
            out.push(current.join(" "));
            return;
        }
        for (let i = 0; i < items.length; i++) {
            if (used[i])
                continue;
            used[i] = true;
            current.push(items[i]);
            walk();
            current.pop();
            used[i] = false;
            if (out.length >= limit)
                return;
        }
    };
    walk();
    const total = factorial(items.length);
    return [
        `${total} permutation(s) of ${items.length} item(s)${out.length < Number(total) ? `, first ${out.length}` : ""}:`,
        "",
        ...out,
    ].join("\n");
}
export async function combinationsOf(a) {
    const items = itemsFrom(a.items);
    const choose = parseInt10(String(a.choose), "choose");
    if (choose < 1 || choose > items.length)
        throw new SourceError("choose must be between 1 and the number of items");
    const limit = clampLimit(a.limit, 50, 500);
    const out = [];
    const current = [];
    const walk = (start) => {
        if (out.length >= limit)
            return;
        if (current.length === choose) {
            out.push(current.join(" "));
            return;
        }
        for (let i = start; i < items.length; i++) {
            current.push(items[i]);
            walk(i + 1);
            current.pop();
            if (out.length >= limit)
                return;
        }
    };
    walk(0);
    let total = 1n;
    for (let i = 0; i < choose; i++)
        total = (total * BigInt(items.length - i)) / BigInt(i + 1);
    return [
        `${total} combination(s) of ${choose} from ${items.length} item(s)${out.length < Number(total) ? `, first ${out.length}` : ""}:`,
        "",
        ...out,
    ].join("\n");
}
