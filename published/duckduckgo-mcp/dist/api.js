const UA = "mrfentmen-duckduckgo-mcp/1.0 (https://github.com/mrfentmen)";
export class DdgError extends Error {
}
export async function instantAnswer(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new DdgError("Provide a query");
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
    if (!res.ok)
        throw new DdgError(`DuckDuckGo returned HTTP ${res.status}`);
    const d = (await res.json());
    const lines = [];
    if (d?.Heading)
        lines.push(`Heading: ${d.Heading}`);
    if (d?.Answer)
        lines.push(`Answer: ${d.Answer}`);
    if (d?.Definition)
        lines.push(`Definition: ${d.Definition}`);
    if (d?.AbstractText)
        lines.push(`\nSummary:\n${d.AbstractText}`);
    if (d?.AbstractURL)
        lines.push(`\nSource: ${d.AbstractURL}`);
    const related = (d?.RelatedTopics ?? []).filter((t) => t?.Text).slice(0, 5);
    if (related.length) {
        lines.push("", "Related:");
        related.forEach((t, i) => lines.push(`${i + 1}. ${t.Text}`));
    }
    if (!lines.length)
        return `No instant answer found for \"${q}\". Try a more specific query.`;
    return lines.join("\n");
}
// ---- muxA tools:
const DDG_API = "https://api.duckduckgo.com/";
async function ddg(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": "mrfentmen-duckduckgo-mcp/1.0 (https://github.com/mrfentmen)", Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new DdgError(`DuckDuckGo returned HTTP ${res.status}`);
    return (await res.json());
}
function anchors(html) {
    const out = [];
    for (const m of String(html ?? "").matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
        const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (m[1] && text)
            out.push({ url: m[1], text });
    }
    return out;
}
export async function answerDiagnostics(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new DdgError("Provide a query.");
    const d = await ddg(`${DDG_API}?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`);
    const fields = [
        ["Heading", String(d.Heading ?? "")],
        ["Answer", String(d.Answer ?? "")],
        ["AnswerType", String(d.AnswerType ?? "")],
        ["Definition", String(d.Definition ?? "")],
        ["DefinitionSource", String(d.DefinitionSource ?? "")],
        ["Abstract", String(d.AbstractText ?? "")],
        ["Entity", String(d.Entity ?? "")],
        ["Redirect", String(d.Redirect ?? "")],
        ["Image", String(d.Image ?? "")],
    ];
    const present = fields.filter(([, v]) => v.trim());
    const empty = fields.filter(([, v]) => !v.trim()).map(([k]) => k);
    const nested = (d.RelatedTopics ?? []).filter((t) => (t.Topics ?? []).length).length;
    return [
        `DuckDuckGo Instant Answer diagnostics for "${q}".`,
        present.length ? `Populated fields: ${present.map(([k, v]) => `${k} (${v.length} chars)`).join(", ")}` : "No Instant Answer field was populated for this query.",
        empty.length ? `Empty fields: ${empty.join(", ")}` : "Every known field was populated.",
        `RelatedTopics: ${(d.RelatedTopics ?? []).length} entries, of which ${nested} carry a nested Topics array.`,
        typeof d.Icon !== "undefined" ? `Icon hint: ${String(d.Icon).slice(0, 80)}` : "",
        "",
        present.length
            ? "DuckDuckGo only returns an Instant Answer for terms it has curated data for. For general web results use web_results, and for structured entity fields use entity_infobox."
            : "This term has no curated Instant Answer. Use web_results for web results, which is a different endpoint and does return links.",
    ]
        .filter((l) => l !== "")
        .join("\n");
}
