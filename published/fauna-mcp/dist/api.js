/**
 * Fauna query API client (FQL v10). Points at Fauna Cloud by default via
 * FAUNA_URL, or any self-hosted/local endpoint. Needs FAUNA_SECRET.
 * Docs: https://docs.fauna.com/fauna/current/api/
 */
const BASE = (process.env.FAUNA_URL ?? "https://db.fauna.com").replace(/\/+$/, "");
export class FaunaError extends Error {
}
function headers() {
    const secret = process.env.FAUNA_SECRET;
    if (!secret)
        throw new FaunaError("Set FAUNA_SECRET first (a database secret).");
    return {
        "User-Agent": "fauna-mcp/1.0",
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
    };
}
async function query(fql) {
    if (!fql.trim())
        throw new FaunaError("Query is empty.");
    const res = await fetch(`${BASE}/query/1`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ query: fql }),
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 401 || res.status === 403)
        throw new FaunaError("Fauna refused (401/403). Check FAUNA_SECRET.");
    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new FaunaError(`Fauna error ${res.status}: ${msg.slice(0, 200)}`);
    }
    return (await res.json());
}
export async function listCollections() {
    const data = await query("Collection.all().map(c => c.name)");
    const rows = data.data ?? data;
    const names = Array.isArray(rows?.data) ? rows.data : Array.isArray(rows) ? rows : [];
    return names.map(String).slice(0, 50);
}
export async function runQuery(fql) {
    const data = await query(fql);
    const payload = ("data" in data ? data.data : data);
    return JSON.stringify(payload, null, 2).slice(0, 2000);
}
// ---- muxE tools:
// Both existing tools need a live Fauna database and a FAUNA_SECRET, and the
// cloud host does not even resolve from here, so neither can be proven. The
// tool here deliberately needs no database and no secret: it reads an FQL v10
// expression and compares it, which is work a caller has to do by hand today;
// fql_lint moved to the licence gateway (src/gateway.ts).
const MAX_QUERY = 8000;
/**
 * A real tokeniser for the FQL v10 surface syntax: identifiers, numbers,
 * single and double quoted strings with the ++ interpolation FQL uses, and the
 * operators. It is deliberately a lexer plus a balance checker rather than a
 * full parser, and it says so rather than claiming a type check it does not do.
 */
function lex(source) {
    const tokens = [];
    let unterminated = 0;
    let i = 0;
    while (i < source.length) {
        const ch = source[i];
        if (/\s/.test(ch)) {
            i += 1;
            continue;
        }
        if (ch === '"' || ch === "'") {
            const quote = ch;
            const at = i;
            let j = i + 1;
            let closed = false;
            while (j < source.length) {
                if (source[j] === "\\") {
                    j += 2;
                    continue;
                }
                if (source[j] === quote) {
                    closed = true;
                    j += 1;
                    break;
                }
                j += 1;
            }
            if (!closed)
                unterminated += 1;
            tokens.push({ kind: "string", value: source.slice(at, Math.min(j, source.length)), at });
            i = j;
            continue;
        }
        if (/[0-9]/.test(ch)) {
            const at = i;
            while (i < source.length && /[0-9._eE+\-]/.test(source[i])) {
                // a sign only continues the number when it follows an exponent marker
                if ((source[i] === "+" || source[i] === "-") && !/[eE]/.test(source[i - 1] ?? ""))
                    break;
                i += 1;
            }
            tokens.push({ kind: "number", value: source.slice(at, i), at });
            continue;
        }
        if (/[A-Za-z_$]/.test(ch)) {
            const at = i;
            while (i < source.length && /[A-Za-z0-9_$]/.test(source[i]))
                i += 1;
            tokens.push({ kind: "name", value: source.slice(at, i), at });
            continue;
        }
        const three = source.slice(i, i + 3);
        const two = source.slice(i, i + 2);
        if (["===", "!==", "?.", "??", ".."].includes(three)) {
            tokens.push({ kind: "op", value: three, at: i });
            i += 3;
            continue;
        }
        if (["==", "!=", "<=", ">=", "&&", "||", "?."].includes(two)) {
            tokens.push({ kind: "op", value: two, at: i });
            i += 2;
            continue;
        }
        tokens.push({ kind: "op", value: ch, at: i });
        i += 1;
    }
    return { tokens, unterminated };
}
const FQL_BUILTINS = new Set([
    "Array", "Boolean", "Database", "Date", "Duration", "Math", "Object", "Query", "Resource",
    "Set", "Stream", "String", "Time", "Timestamp", "Map",
]);
const CHAIN_METHODS = new Set([
    "all", "any", "at", "count", "delete", "drop", "exists", "first", "foreach", "get", "insert",
    "isEmpty", "last", "let", "limit", "map", "order", "paginate", "reduce", "replace", "select",
    "stream", "sum", "take", "to", "unique", "update", "where",
]);
function chainOf(tokens) {
    const methods = [];
    let root = "";
    for (let i = 0; i < tokens.length; i += 1) {
        const token = tokens[i];
        if (token.kind !== "name")
            continue;
        const prev = tokens[i - 1];
        const afterDot = !!prev && (prev.value === "." || prev.value === "?.");
        if (afterDot) {
            if (CHAIN_METHODS.has(token.value))
                methods.push(token.value);
            continue;
        }
        // the first capitalised name that is not a built in type and does not follow
        // a dot is the collection, which still works after a "let x = 1;" prefix
        if (!root && /^[A-Z]/.test(token.value) && !FQL_BUILTINS.has(token.value)) {
            root = token.value;
        }
    }
    return { methods, root };
}
export async function fqlCompare(args) {
    const before = (args?.before ?? '').slice(0, MAX_QUERY);
    const after = (args?.after ?? '').slice(0, MAX_QUERY);
    if (!before.trim() || !after.trim())
        return "Provide both the earlier FQL expression in before and the later one in after.";
    const left = lex(before);
    const right = lex(after);
    const leftChain = chainOf(left.tokens);
    const rightChain = chainOf(right.tokens);
    const leftArgs = left.tokens.filter((t) => t.kind === "number" || t.kind === "string").map((t) => t.value);
    const rightArgs = right.tokens.filter((t) => t.kind === "number" || t.kind === "string").map((t) => t.value);
    const setOf = (list) => new Set(list);
    const leftMethods = setOf(leftChain.methods);
    const rightMethods = setOf(rightChain.methods);
    const addedMethods = rightChain.methods.filter((m) => !leftMethods.has(m));
    const removedMethods = leftChain.methods.filter((m) => !rightMethods.has(m));
    const leftLiterals = setOf(leftArgs);
    const addedLiterals = rightArgs.filter((v) => !leftLiterals.has(v));
    const removedLiterals = leftArgs.filter((v) => !setOf(rightArgs).has(v));
    const same = before.replace(/\s+/g, " ") === after.replace(/\s+/g, " ");
    const lines = [
        'Comparing two FQL expressions by structure rather than by text:',
        `  identical once whitespace is collapsed: ${same ? 'yes' : 'no'}`,
        `  collection: ${leftChain.root || 'none'} -> ${rightChain.root || 'none'}${leftChain.root === rightChain.root ? ' (unchanged)' : ' (CHANGED)'}`,
        `  chain methods: ${leftChain.methods.length} -> ${rightChain.methods.length}`,
        `  method order before: ${leftChain.methods.join(' then ') || 'none'}`,
        `  method order after: ${rightChain.methods.join(' then ') || 'none'}`,
    ];
    lines.push(`  methods only in the later query: ${addedMethods.length ? addedMethods.join(', ') : 'none'}`);
    lines.push(`  methods only in the earlier query: ${removedMethods.length ? removedMethods.join(', ') : 'none'}`);
    if (leftChain.methods.join(',') !== rightChain.methods.join(',')) {
        lines.push('  the method sequence differs, so these are not the same query with a different filter value.');
    }
    lines.push(`  literal arguments: ${leftArgs.length} -> ${rightArgs.length}`);
    lines.push(`  literals only in the later query: ${addedLiterals.length ? addedLiterals.slice(0, 20).join(', ') : 'none'}`);
    lines.push(`  literals only in the earlier query: ${removedLiterals.length ? removedLiterals.slice(0, 20).join(', ') : 'none'}`);
    const leftProblems = left.unterminated > 0 || (before.match(/[([{]/g)?.length ?? 0) !== (before.match(/[)\]}]/g)?.length ?? 0);
    const rightProblems = right.unterminated > 0 || (after.match(/[([{]/g)?.length ?? 0) !== (after.match(/[)\]}]/g)?.length ?? 0);
    lines.push(`  delimiter balance, earlier: ${leftProblems ? 'unbalanced' : 'balanced'}, later: ${rightProblems ? 'unbalanced' : 'balanced'}`);
    lines.push('  a value change inside a long expression shows up as one literal here; the existing run_query tool can only show it by executing against a database.');
    return lines.join("\n");
}
