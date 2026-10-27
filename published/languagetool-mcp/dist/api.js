/**
 * LanguageTool public API client, keyless (fair-use limits).
 * Docs: https://languagetool.org/http-api/rest-api
 */
const BASE = "https://api.languagetool.org/v2";
export class LanguageToolError extends Error {
}
export async function checkText(text, language = "auto") {
    if (!text || !text.trim())
        throw new LanguageToolError("Text is empty.");
    if (text.length > 20000)
        throw new LanguageToolError("Text too long (max 20000 chars on the public API).");
    const body = new URLSearchParams({ text, language, enabledOnly: "false" });
    const res = await fetch(`${BASE}/check`, {
        method: "POST",
        headers: { "User-Agent": "languagetool-mcp/1.0", "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: body.toString(),
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new LanguageToolError(`LanguageTool error ${res.status}`);
    const data = (await res.json());
    const matches = Array.isArray(data.matches) ? data.matches : [];
    return {
        truncated: Boolean(data?.warnings?.incompleteResults),
        matches: matches.slice(0, 15).map((m) => {
            const ctx = (m.context ?? {});
            const reps = Array.isArray(m.replacements) ? m.replacements : [];
            return {
                message: String(m.message ?? "?"),
                short: m.shortMessage ? String(m.shortMessage) : undefined,
                offset: Number(m.offset ?? 0),
                length: Number(m.length ?? 0),
                fragment: String(ctx.text ?? "").slice(Math.max(0, Number(ctx.offset ?? 0)), Number(ctx.offset ?? 0) + Number(ctx.length ?? 0)).slice(0, 120),
                suggestions: reps.slice(0, 3).map((r) => String(r.value)),
                rule: m.rule?.id ? String(m.rule.id) : undefined,
                category: m.rule?.category?.name ? String(m.rule.category.name) : undefined,
            };
        }),
    };
}
export async function listLanguages() {
    const rows = await fetch(`${BASE}/languages`, {
        headers: { "User-Agent": "languagetool-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
    }).then((r) => {
        if (!r.ok)
            throw new LanguageToolError(`LanguageTool error ${r.status}`);
        return r.json();
    });
    return rows.map((l) => ({ code: String(l.longCode ?? l.code), name: String(l.name ?? l.code) }));
}
export function formatResult(r) {
    if (r.matches.length === 0)
        return "No issues found.";
    const lines = r.matches.map((m, i) => {
        const sug = m.suggestions.length ? ` → try: ${m.suggestions.join(", ")}` : "";
        const where = m.fragment ? ` ("...${m.fragment}...")` : "";
        return `${i + 1}. ${m.message}${m.category ? ` [${m.category}]` : ""}${where}${sug}`;
    });
    if (r.truncated)
        lines.push("(results truncated by the API)");
    return `Found ${r.matches.length} issue${r.matches.length === 1 ? "" : "s"}:\n\n${lines.join("\n")}`;
}
async function dictionaryEntries(word) {
    const clean = word.trim();
    if (!clean || clean.length > 80)
        throw new LanguageToolError('Provide an English word of 1–80 characters.');
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`, {
        headers: { 'User-Agent': 'mrfentmen-languagetool-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new LanguageToolError(`Dictionary API returned ${res.status}`);
    return await res.json();
}
export async function usageExamples(args) {
    const limit = Math.max(1, Math.min(Math.round(args.limit ?? 5), 15));
    const entries = await dictionaryEntries(args.word);
    const rows = entries.flatMap(e => (e.meanings ?? []).flatMap(m => (m.definitions ?? [])
        .filter(d => typeof d.example === 'string' && d.example.trim())
        .map(d => ({ example: d.example, sense: d.definition, pos: m.partOfSpeech })))).slice(0, limit);
    if (!rows.length)
        return `Usage examples not reported for ${args.word}.`;
    return `Dictionary usage examples for ${args.word}:\n` + rows.map((r, i) => `${i + 1}. ${r.example.slice(0, 400)}\n   ${r.pos ?? 'part of speech not reported'}: ${(r.sense ?? 'sense not reported').slice(0, 250)}`).join('\n');
}
