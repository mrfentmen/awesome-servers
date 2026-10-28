/**
 * Semantic Version — keyless public API client.
 */
const BASE = "https://example.invalid";
const SOURCE = "Semantic Version";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "semver-mcp", accept },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path) {
    const res = await request(path);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export async function getText(path, accept = "text/plain") {
    const res = await request(path, accept);
    return (await res.text()).trim();
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
export function section(title, rows) {
    return [title, ...rows.filter(Boolean)].join("\n");
}
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;
function parseStrict(input) {
    const raw = clean(input).replace(/^v(?=\d)/i, "");
    const m = SEMVER_RE.exec(raw);
    if (!m)
        throw new SourceError(`"${clean(input)}" is not a semantic version - expected MAJOR.MINOR.PATCH, e.g. 1.2.3`);
    const pre = m[4] ? m[4].split(".") : [];
    for (const id of pre) {
        if (!id.length || !/^[0-9A-Za-z-]+$/.test(id))
            throw new SourceError(`"${id}" is not a valid prerelease identifier`);
        if (/^\d+$/.test(id) && id.length > 1 && id.startsWith("0"))
            throw new SourceError(`numeric prerelease identifier "${id}" must not have leading zeros`);
    }
    return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), pre, build: m[5] ?? "", raw };
}
function comparePre(a, b) {
    if (!a.length && !b.length)
        return 0;
    if (!a.length)
        return 1;
    if (!b.length)
        return -1;
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
        const x = a[i];
        const y = b[i];
        if (x === undefined)
            return -1;
        if (y === undefined)
            return 1;
        const xNum = /^\d+$/.test(x);
        const yNum = /^\d+$/.test(y);
        if (xNum && yNum) {
            const d = Number(x) - Number(y);
            if (d !== 0)
                return d < 0 ? -1 : 1;
            continue;
        }
        if (xNum)
            return -1;
        if (yNum)
            return 1;
        if (x !== y)
            return x < y ? -1 : 1;
    }
    return 0;
}
function compare(a, b) {
    if (a.major !== b.major)
        return a.major < b.major ? -1 : 1;
    if (a.minor !== b.minor)
        return a.minor < b.minor ? -1 : 1;
    if (a.patch !== b.patch)
        return a.patch < b.patch ? -1 : 1;
    return comparePre(a.pre, b.pre);
}
function mk(major, minor, patch, pre = []) {
    return { major, minor, patch, pre, build: "", raw: `${major}.${minor}.${patch}${pre.length ? `-${pre.join(".")}` : ""}` };
}
function parseTarget(input) {
    const text = clean(input).replace(/^v(?=\d)/i, "");
    if (!text || text === "*" || text === "x" || text === "X")
        return { version: mk(0, 0, 0), parts: 0 };
    const cleaned = text.replace(/[xX*]/g, "").replace(/\.+$/, "");
    const [numericPart, ...preRest] = cleaned.split("+")[0].split("-");
    const raw = numericPart.split(".").filter(Boolean);
    if (!raw.length)
        throw new SourceError(`"${input}" is not a version or partial version, e.g. 1, 1.2 or 1.2.3`);
    const nums = raw.map((p) => {
        if (!/^\d+$/.test(p))
            throw new SourceError(`"${input}" is not a version or partial version, e.g. 1, 1.2 or 1.2.3`);
        return Number(p);
    });
    if (nums.length > 3)
        throw new SourceError(`"${input}" has more than three numeric parts`);
    const pre = preRest.join("-").split(".").filter(Boolean);
    for (const id of pre) {
        if (!/^[0-9A-Za-z-]+$/.test(id))
            throw new SourceError(`prerelease identifier "${id}" is not valid`);
    }
    return { version: mk(nums[0], nums[1] ?? 0, nums[2] ?? 0, pre), parts: nums.length };
}
function nextAfter(t) {
    if (t.parts >= 3)
        return mk(t.version.major, t.version.minor, t.version.patch + 1);
    if (t.parts === 2)
        return mk(t.version.major, t.version.minor + 1, 0);
    return mk(t.version.major + 1, 0, 0);
}
function xRange(rest) {
    if (clean(rest).replace(/[xX*]/g, "") === "")
        return [];
    const t = parseTarget(rest);
    if (t.parts >= 3)
        return [{ op: "=", version: t.version }];
    return [{ op: ">=", version: t.version }, { op: "<", version: nextAfter(t) }];
}
function expand(token) {
    const t = clean(token);
    if (!t || t === "*" || t === "x" || t === "X")
        return [];
    const m = /^(>=|<=|>|<|=|~>|~|\^)?\s*(.*)$/.exec(t);
    const op = m?.[1] ?? "";
    const rest = (m?.[2] ?? "").trim();
    if (!rest)
        throw new SourceError(`"${t}" has an operator but no version`);
    const target = parseTarget(rest);
    const partial = target.parts < 3;
    switch (op) {
        case ">=":
            return [{ op: ">=", version: target.version }];
        case ">":
            return [{ op: partial ? ">=" : ">", version: partial ? nextAfter(target) : target.version }];
        case "<":
            return [{ op: "<", version: target.version }];
        case "<=":
            return [{ op: partial ? "<" : "<=", version: partial ? nextAfter(target) : target.version }];
        case "=":
            return xRange(rest);
        case "~":
        case "~>":
            return [{ op: ">=", version: target.version }, { op: "<", version: mk(target.version.major, target.version.minor + 1, 0) }];
        case "^": {
            const v = target.version;
            const upper = v.major > 0 ? mk(v.major + 1, 0, 0) : v.minor > 0 ? mk(0, v.minor + 1, 0) : mk(0, 0, v.patch + 1);
            return [{ op: ">=", version: v }, { op: "<", version: upper }];
        }
        default:
            return xRange(rest);
    }
}
function hyphenRange(left, right) {
    const low = parseTarget(left);
    const high = parseTarget(right);
    if (low.parts === 0 || high.parts === 0)
        throw new SourceError("a hyphen range needs versions on both sides");
    const lower = [{ op: ">=", version: low.version }];
    if (high.parts >= 3)
        return [...lower, { op: "<=", version: high.version }];
    return [...lower, { op: "<", version: nextAfter(high) }];
}
function partialCompare(v, c) {
    const d = compare(v, c.version);
    switch (c.op) {
        case ">": return d > 0;
        case ">=": return d >= 0;
        case "<": return d < 0;
        case "<=": return d <= 0;
        case "=": return d === 0;
    }
}
function describeComparator(c) {
    return `${c.op === "=" ? "=" : c.op}${c.version.major}.${c.version.minor}.${c.version.patch}`;
}
export async function parseVersion(a) {
    const v = parseStrict(a.version);
    return [
        `${clean(a.version)}`,
        `major ${v.major} · minor ${v.minor} · patch ${v.patch}`,
        v.pre.length ? `prerelease: ${v.pre.join(".")}` : "prerelease: none (this is a normal release)",
        v.build ? `build metadata: ${v.build}` : "build metadata: none",
        "",
        "Precedence order: compare major, then minor, then patch, then prerelease identifiers (a release outranks any prerelease of the same version).",
    ].join("\n");
}
export async function compareVersions(a) {
    const left = parseStrict(a.a);
    const right = parseStrict(a.b);
    const d = compare(left, right);
    const rel = d === 0 ? "equal to" : d < 0 ? "lower than" : "higher than";
    const why = left.major !== right.major
        ? `major ${left.major} vs ${right.major}`
        : left.minor !== right.minor
            ? `minor ${left.minor} vs ${right.minor}`
            : left.patch !== right.patch
                ? `patch ${left.patch} vs ${right.patch}`
                : `prerelease [${left.pre.join(".") || "-"}] vs [${right.pre.join(".") || "-"}]`;
    return [
        `${left.raw} is ${rel} ${right.raw} (result ${d})`,
        `Decided by ${why}.`,
        `Full forms: ${left.major}.${left.minor}.${left.patch}${left.pre.length ? `-${left.pre.join(".")}` : ""} vs ${right.major}.${right.minor}.${right.patch}${right.pre.length ? `-${right.pre.join(".")}` : ""}`,
    ].join("\n");
}
export async function sortVersions(a) {
    const versions = (a.versions ?? []).map((v) => clean(v));
    if (!versions.length || versions.length > 100)
        throw new SourceError("versions must list between 1 and 100 versions");
    const parsed = versions.map(parseStrict);
    const sorted = [...parsed].sort(compare);
    const ordered = a.descending ? sorted.reverse() : sorted;
    const lowest = sorted[0];
    return [
        `Sorted ${sorted.length} version(s)${a.descending ? " (highest first)" : " (lowest first)"}:`,
        "",
        ...ordered.map((v, i) => `${i + 1}. ${v.major}.${v.minor}.${v.patch}${v.pre.length ? `-${v.pre.join(".")}` : ""}${v.build ? `+${v.build}` : ""}`),
        "",
        `Lowest: ${lowest.major}.${lowest.minor}.${lowest.patch}${lowest.pre.length ? `-${lowest.pre.join(".")}` : ""}`,
    ].join("\n");
}
export async function satisfiesRange(a) {
    const version = parseStrict(a.version);
    const range = clean(a.range);
    if (!range)
        throw new SourceError("range must not be empty");
    const groups = range.split("||").map((g) => g.trim()).filter(Boolean);
    if (!groups.length)
        throw new SourceError("range must contain at least one clause");
    const results = [];
    let anyOk = false;
    for (const group of groups) {
        const hyphen = /^(\S+)\s+-\s+(\S+)$/.exec(group);
        let comparators;
        if (hyphen) {
            comparators = hyphenRange(hyphen[1], hyphen[2]);
        }
        else {
            comparators = group.split(/\s+/).flatMap(expand);
        }
        const shown = comparators.length ? comparators.map(describeComparator).join(" ") : "* (any version)";
        let ok = comparators.every((c) => partialCompare(version, c));
        let note = "";
        if (ok && version.pre.length) {
            const matchingPre = comparators.filter((c) => c.version.pre.length && c.version.major === version.major && c.version.minor === version.minor && c.version.patch === version.patch);
            if (!matchingPre.length) {
                ok = false;
                note = " - a prerelease only satisfies a range that names a prerelease of the same version";
            }
        }
        anyOk = anyOk || ok;
        results.push(`- ${shown} → ${ok ? "satisfied" : "not satisfied"}${note}`);
    }
    return [
        `${version.major}.${version.minor}.${version.patch}${version.pre.length ? `-${version.pre.join(".")}` : ""} vs range "${range}"`,
        anyOk ? "Result: satisfied (at least one clause matches)" : "Result: not satisfied",
        "",
        "Clauses:",
        ...results,
    ].join("\n");
}
