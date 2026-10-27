/**
 * JokeAPI client, keyless.
 * Safe mode is always on so nothing offensive can come back.
 */
export class JokeError extends Error {
    constructor(message) {
        super(message);
        this.name = "JokeError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = "mrfentmen-jokeapi-mcp/1.0";
const BASE = "https://v2.jokeapi.dev";
async function get(path) {
    let res;
    try {
        res = await fetch(BASE + path, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(20000),
        });
    }
    catch (e) {
        throw new JokeError(`Could not reach jokeapi.dev: ${errorMessage(e)}`);
    }
    const body = (await res.text()).slice(0, 100000);
    if (!res.ok) {
        throw new JokeError(`jokeapi.dev returned HTTP ${res.status}: ${body.slice(0, 160)}`);
    }
    try {
        return JSON.parse(body);
    }
    catch {
        throw new JokeError("jokeapi.dev returned a non-JSON response.");
    }
}
function unwrap(data) {
    const env = data;
    if (env.error) {
        throw new JokeError(env.message ? String(env.message) : `jokeapi error ${env.code ?? ""}`.trim());
    }
    return env;
}
export async function listCategories() {
    const data = (await get("/categories"));
    if (!Array.isArray(data.categories))
        throw new JokeError("No categories returned.");
    return `${data.categories.length} safe-mode categories:\n\n${data.categories.map((c) => `  ${c}`).join("\n")}`;
}
export function formatJoke(j, index) {
    const prefix = typeof index === "number" ? `${index + 1}. ` : "";
    const tag = j.category ? `[${j.category}${j.type ? ` · ${j.type}` : ""}]` : "";
    if (j.type === "twopart") {
        return `${prefix}${j.setup ?? ""}\n   ${j.delivery ?? ""}\n   ${tag}`.trimEnd();
    }
    return `${prefix}${j.joke ?? "(no joke returned)"}${tag ? `\n   ${tag}` : ""}`;
}
function pick(envelope) {
    if (Array.isArray(envelope.jokes))
        return envelope.jokes;
    const single = envelope;
    return single.joke || single.setup ? [single] : [];
}
export async function getJoke(category, amount) {
    const cat = (category ?? "Any").trim() || "Any";
    const size = Math.min(Math.max(Math.round(amount) || 1, 1), 10);
    const query = `/joke/${encodeURIComponent(cat)}?safe-mode${size > 1 ? `&amount=${size}` : ""}`;
    const jokes = pick(unwrap(await get(query)));
    if (jokes.length === 0)
        throw new JokeError("No joke returned.");
    if (jokes.length === 1)
        return formatJoke(jokes[0]);
    return `${jokes.length} jokes from ${cat}:\n\n${jokes.map((j, i) => formatJoke(j, i)).join("\n\n")}`;
}
export async function searchJokes(contains, category, amount) {
    const text = contains.trim();
    if (!text)
        throw new JokeError("Give a word to search for.");
    const cat = (category ?? "Any").trim() || "Any";
    const size = Math.min(Math.max(Math.round(amount) || 3, 1), 10);
    const path = `/joke/${encodeURIComponent(cat)}?safe-mode&contains=${encodeURIComponent(text)}&amount=${size}`;
    const jokes = pick(unwrap(await get(path)));
    if (jokes.length === 0)
        return `No jokes containing "${text}".`;
    return `Jokes containing "${text}" (${jokes.length}):\n\n${jokes.map((j, i) => formatJoke(j, i)).join("\n\n")}`;
}
export async function jokeById(id, category) {
    const clean = id.trim();
    if (!/^\d+$/.test(clean))
        throw new JokeError(`"${id}" is not a joke id - ids are numbers.`);
    const cat = (category ?? "Any").trim() || "Any";
    const jokes = pick(unwrap(await get(`/joke/${encodeURIComponent(cat)}?safe-mode&idRange=${clean}-${clean}`)));
    if (jokes.length === 0)
        return `No joke with id ${clean} in ${cat}.`;
    return formatJoke(jokes[0]);
}
export async function jokeInfo() {
    const info = (await get("/info"));
    if (!info.jokes)
        throw new JokeError("No info returned.");
    const rows = Object.entries(info.jokes.categories ?? {})
        .sort((a, b) => b[1] - a[1])
        .map(([cat, n]) => `  ${cat.padEnd(14)} ${n}`);
    return [
        `JokeAPI v${info.version ?? "?"}`,
        "",
        `  total jokes  ${info.jokes.totalCount}`,
        `  formats      ${(info.formats ?? ["json"]).join(", ")}`,
        "",
        "Jokes per category:",
        ...rows,
    ].join("\n");
}
export async function listLanguages() {
    const data = (await get("/languages"));
    const possible = data.possibleLanguages ?? [];
    if (possible.length === 0)
        throw new JokeError("No language list returned.");
    const rows = possible.map((l) => `  ${l.code}  ${l.name}`);
    return [
        `JokeAPI default language: ${data.defaultLanguage ?? "en"}`,
        `Translated jokes are available in: ${(data.jokeLanguages ?? []).join(", ")}`,
        `The API messages themselves support: ${(data.systemLanguages ?? []).join(", ")}`,
        "",
        `${possible.length} languages recognised by the API:`,
        ...rows,
    ].join("\n");
}
// ---- batch-4 tools: type filter and id range (2026-09-27) ----
const JOKE_TYPES = ["single", "twopart"];
export async function jokesByType(args) {
    const type = String(args?.type ?? "twopart").trim().toLowerCase();
    if (!JOKE_TYPES.includes(type)) {
        throw new JokeError(`"${args?.type}" is not a joke type - use single (one-liners) or twopart (setup and punchline).`);
    }
    const cat = (args?.category ?? "Any").trim() || "Any";
    const size = Math.min(Math.max(Math.round(Number(args?.amount ?? 3)) || 3, 1), 10);
    const jokes = pick(unwrap(await get(`/joke/${encodeURIComponent(cat)}?safe-mode&type=${type}&amount=${size}`)));
    if (jokes.length === 0)
        throw new JokeError(`No ${type} jokes in ${cat}.`);
    return `${jokes.length} ${type} joke(s) from ${cat}:\n\n${jokes.map((j, i) => formatJoke(j, i)).join("\n\n")}`;
}
export async function jokeRange(args) {
    const from = Math.floor(Number(args?.from ?? 0));
    const to = Math.floor(Number(args?.to ?? 0));
    if (!Number.isFinite(from) || !Number.isFinite(to) || from <= 0 || to <= 0) {
        throw new JokeError("Give two positive joke ids, from and to.");
    }
    if (to < from)
        throw new JokeError(`from (${from}) must not be greater than to (${to}).`);
    if (to - from > 5000)
        throw new JokeError(`Range too wide: ask for at most 5000 ids, got ${to - from}.`);
    const cat = (args?.category ?? "Any").trim() || "Any";
    const size = Math.min(Math.max(Math.round(Number(args?.amount ?? 3)) || 3, 1), 10);
    const jokes = pick(unwrap(await get(`/joke/${encodeURIComponent(cat)}?safe-mode&idRange=${from}-${to}&amount=${size}`)));
    if (jokes.length === 0)
        return `No ${cat} jokes with ids between ${from} and ${to}.`;
    const ids = jokes.map((j) => j.id).filter((id) => typeof id === "number");
    return [
        `${jokes.length} joke(s) from ids ${from}-${to} in ${cat}${ids.length ? ` (returned ids ${ids.join(", ")})` : ""}:`,
        "",
        ...jokes.map((j, i) => formatJoke(j, i)),
        "",
        "Ids are not guaranteed contiguous inside a range: gaps are categories you filtered out.",
    ].join("\n");
}
// ---- muxG tools:
const JOKE_KINDS = ['single', 'twopart', 'chain', 'dad', 'steven', 'list', 'programming', 'dark', 'any'];
/** The endpoint returns a single joke as the top-level object, or a list under "jokes". */
const jokesIn = (data) => {
    const list = Array.isArray(data.jokes) ? data.jokes : [];
    if (list.length)
        return list;
    const own = data;
    if (typeof own.joke === 'string' || typeof own.setup === 'string' || typeof own.delivery === 'string')
        return [own];
    return [];
};
const bodyOf = (j) => {
    if (typeof j.joke === 'string')
        return j.joke;
    return [j.setup, j.delivery].filter((part) => typeof part === 'string').join(' ');
};
/** How long the jokes actually are, measured rather than guessed, with the setup and delivery split. */
export async function jokeLengthProfile(args) {
    const count = Math.max(1, Math.min(Number(args.count ?? 12) || 12, 30));
    const type = String(args.type ?? '').trim().toLowerCase();
    if (type && !JOKE_KINDS.includes(type)) {
        return `Type must be one of ${JOKE_KINDS.join(', ')}, not "${args.type}".`;
    }
    const wanted = String(args.flags ?? '').split(',').map((f) => f.trim().toLowerCase()).filter(Boolean);
    const rows = [];
    const failures = [];
    for (let attempt = 0; attempt < count * 3 && rows.length < count; attempt += 1) {
        const params = new URLSearchParams({ 'safe-mode': '' });
        params.set('safe-mode', 'true');
        if (type && type !== 'any')
            params.set('type', type);
        for (const flag of wanted)
            params.append('flags', flag);
        let data;
        try {
            data = (await get(`/joke/any?${params.toString()}`));
        }
        catch (e) {
            failures.push(e.message);
            break;
        }
        for (const j of jokesIn(data)) {
            const text = bodyOf(j);
            if (!text)
                continue;
            rows.push({ j, text, chars: text.length, words: text.split(/\s+/).filter(Boolean).length });
        }
    }
    if (!rows.length) {
        return `The JokeAPI returned no joke for that combination${failures.length ? ` (${failures[0]})` : ''}. Flags requested: ${wanted.join(', ') || 'none'}.`;
    }
    const chars = rows.map((row) => row.chars).sort((a, b) => a - b);
    const words = rows.map((row) => row.words).sort((a, b) => a - b);
    const middle = Math.floor(rows.length / 2);
    const median = (values) => values.length % 2 ? values[middle] : Math.round((values[middle - 1] + values[middle]) / 2);
    const byType = new Map();
    let setups = 0;
    let deliveries = 0;
    for (const row of rows) {
        const key = String(row.j.type ?? 'not reported');
        byType.set(key, (byType.get(key) ?? 0) + 1);
        if (typeof row.j.setup === 'string')
            setups += 1;
        if (typeof row.j.delivery === 'string')
            deliveries += 1;
    }
    const languages = new Set(rows.map((row) => row.j.lang).filter((lang) => Boolean(lang)));
    const flagged = new Set();
    for (const row of rows) {
        for (const [flag, on] of Object.entries(row.j.flags ?? {}))
            if (on)
                flagged.add(flag);
    }
    const lines = [
        `Length profile of ${rows.length} safe-mode joke(s)${type && type !== 'any' ? ` of type ${type}` : ''}`,
        `Characters: min ${chars[0]} · median ${median(chars)} · max ${chars[chars.length - 1]}`,
        `Words: min ${words[0]} · median ${median(words)} · max ${words[words.length - 1]}`,
        `Types in the sample: ${Array.from(byType.entries()).map(([key, count]) => `${key} (${count})`).join(', ')}`,
        `Languages returned: ${languages.size ? Array.from(languages).join(', ') : 'not reported'}`,
        `Flags the service marked as set: ${flagged.size ? Array.from(flagged).join(', ') : 'none'}${wanted.length ? ` (asked for: ${wanted.join(', ')})` : ''}`,
    ];
    if (setups || deliveries)
        lines.push(`Two-part jokes: ${setups} setup(s) and ${deliveries} delivery/deliveries returned`);
    lines.push('');
    for (const [i, row] of rows.slice(0, 10).entries()) {
        lines.push(`  ${i + 1}. ${row.j.category ?? 'category not reported'} / ${row.j.type ?? '?'} - ${row.chars} chars, ${row.words} words`);
    }
    if (rows.length > 10)
        lines.push(`  ...and ${rows.length - 10} more joke(s) measured.`);
    return lines.join('\n');
}
/** Which types actually have a joke waiting, and how often, by sampling the endpoint that asks for each. */
export async function jokeTypeCoverage(args) {
    const samples = Math.max(2, Math.min(Number(args.samples ?? 8) || 8, 30));
    const types = JOKE_KINDS.filter((type) => type !== 'any');
    const lines = [
        `JokeAPI type coverage: asking for each type ${samples} time(s) in safe mode, one joke per request`,
        'A type with 0 hits returned an empty result for every sample; this measures the live pool, not the catalogue.',
        '',
    ];
    for (const type of types) {
        let hits = 0;
        let chars = 0;
        let lastMessage = '';
        for (let attempt = 0; attempt < samples; attempt += 1) {
            let data;
            try {
                data = (await get(`/joke/any?type=${encodeURIComponent(type)}&safe-mode=true`));
            }
            catch (e) {
                lastMessage = e.message;
                continue;
            }
            for (const j of jokesIn(data)) {
                const text = bodyOf(j);
                if (text) {
                    hits += 1;
                    chars += text.length;
                }
            }
        }
        const rate = ((hits / samples) * 100).toFixed(0);
        const average = hits ? Math.round(chars / hits) : null;
        lines.push(`  ${type.padEnd(12)} ${String(hits).padStart(2)}/${samples} returned (${rate}%)${average ? ` · mean ${average} chars` : ''}${hits === 0 && lastMessage ? ` · ${lastMessage.slice(0, 60)}` : ''}`);
    }
    return lines.join('\n');
}
