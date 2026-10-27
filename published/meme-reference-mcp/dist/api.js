/**
 * Meme reference data from two official, keyless APIs:
 *   - Imgflip  (https://api.imgflip.com/get_memes) — 100 classic templates with
 *     names, pixel dimensions, caption-box counts and lifetime caption counts.
 *   - memegen  (https://api.memegen.link) — template list plus a public image
 *     renderer, and each template carries its Know Your Meme origin link.
 *
 * No HTML is parsed anywhere: both endpoints return documented JSON.
 */
const IMGFLIP = "https://api.imgflip.com";
const MEMEGEN = "https://api.memegen.link";
export class MemeError extends Error {
}
async function getJson(url, timeoutMs = 20000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: ctrl.signal,
            headers: { "user-agent": "meme-reference-mcp", accept: "application/json" },
        });
        if (!res.ok)
            throw new MemeError(`Upstream responded ${res.status}`);
        return await res.json();
    }
    catch (e) {
        if (e instanceof MemeError)
            throw e;
        if (e.name === "AbortError")
            throw new MemeError("Upstream request timed out");
        if (e instanceof SyntaxError)
            throw new MemeError("Upstream returned a non-JSON response");
        throw new MemeError(`Request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
let templateCache = null;
export async function allTemplates() {
    if (templateCache && Date.now() - templateCache.at < 10 * 60 * 1000)
        return templateCache.items;
    const d = await getJson(`${IMGFLIP}/get_memes`);
    if (!d?.success)
        throw new MemeError("Imgflip rejected the template request");
    const items = (d.data?.memes ?? []).map((m) => ({
        id: String(m.id),
        name: String(m.name ?? "unnamed"),
        url: String(m.url ?? ""),
        width: Number(m.width ?? 0),
        height: Number(m.height ?? 0),
        boxCount: Number(m.box_count ?? 0),
        captions: Number(m.captions ?? 0),
    }));
    if (items.length === 0)
        throw new MemeError("Imgflip returned no templates");
    templateCache = { at: Date.now(), items };
    return items;
}
function cap(n) {
    if (n >= 1e6)
        return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3)
        return `${(n / 1e3).toFixed(1)}k`;
    return String(n);
}
const line = (t, i) => {
    const prefix = typeof i === "number" ? `${i + 1}. ` : "• ";
    return `${prefix}${t.name} — ${t.width}×${t.height}, ${t.boxCount} caption box${t.boxCount === 1 ? "" : "es"}, ${cap(t.captions)} captions made`;
};
export async function searchTemplates(query, limit) {
    const q = query.trim().toLowerCase();
    if (q.length < 2)
        throw new MemeError("Search term must be at least 2 characters");
    const words = q.split(/\s+/).filter(Boolean);
    const all = await allTemplates();
    const hits = all
        .filter((t) => words.every((w) => t.name.toLowerCase().includes(w)))
        .sort((a, b) => b.captions - a.captions);
    if (hits.length === 0) {
        return `No Imgflip template matched "${query}". ${all.length} templates are available — try a broader word, or use popular_templates.`;
    }
    const shown = hits.slice(0, limit);
    return [
        `Imgflip templates matching "${query}" (${hits.length} of ${all.length}):`,
        "",
        ...shown.map(line),
        "",
        "Use generate_meme with a template name for a rendered image.",
    ].join("\n");
}
export async function popularTemplates(limit) {
    const all = await allTemplates();
    const top = [...all].sort((a, b) => b.captions - a.captions).slice(0, limit);
    return [`Most-used Imgflip templates (${all.length} available):`, "", ...top.map(line)].join("\n");
}
export async function templateInfo(ref) {
    const q = ref.trim().toLowerCase();
    if (q.length < 2)
        throw new MemeError("Template name must be at least 2 characters");
    const all = await allTemplates();
    const exact = all.find((t) => t.name.toLowerCase() === q || t.id === q);
    const partial = all.filter((t) => t.name.toLowerCase().includes(q));
    const chosen = exact ?? (partial.length === 1 ? partial[0] : undefined);
    if (!chosen) {
        if (partial.length > 1) {
            return [
                `"${ref}" matches ${partial.length} templates — pick one:`,
                "",
                ...partial.slice(0, 15).map((t) => `   ${t.name}`),
            ].join("\n");
        }
        throw new MemeError(`No template named "${ref}"`);
    }
    return [
        `Template: ${chosen.name}`,
        `Imgflip id: ${chosen.id}`,
        `Image: ${chosen.url}`,
        `Size: ${chosen.width}×${chosen.height} px`,
        `Caption boxes: ${chosen.boxCount}`,
        `Captions made with it: ${cap(chosen.captions)}`,
    ].join("\n");
}
export async function randomTemplate() {
    const all = await allTemplates();
    const pick = all[Math.floor(Math.random() * all.length)];
    return [
        `Random template: ${pick.name}`,
        `Image: ${pick.url}`,
        `Size: ${pick.width}×${pick.height} px, ${pick.boxCount} caption box${pick.boxCount === 1 ? "" : "es"}`,
        `Used in ${cap(pick.captions)} captions`,
    ].join("\n");
}
let generatorCache = null;
export async function allGenerators() {
    if (generatorCache && Date.now() - generatorCache.at < 10 * 60 * 1000)
        return generatorCache.items;
    const rows = await getJson(`${MEMEGEN}/templates`);
    if (!Array.isArray(rows))
        throw new MemeError("memegen returned an unexpected payload");
    const items = rows.map((t) => ({
        id: String(t.id ?? ""),
        name: String(t.name ?? t.id ?? "unnamed"),
        lines: Number(t.lines ?? 0),
        styles: Array.isArray(t.styles) ? t.styles.map(String) : [],
        blank: String(t.blank ?? ""),
        source: String(t.source ?? ""),
    }));
    if (items.length === 0)
        throw new MemeError("memegen returned no templates");
    generatorCache = { at: Date.now(), items };
    return items;
}
export async function listGenerators(query, limit) {
    const all = await allGenerators();
    const q = query?.trim().toLowerCase() ?? "";
    const hits = q
        ? all.filter((g) => g.name.toLowerCase().includes(q) || g.id.toLowerCase().includes(q))
        : all;
    if (hits.length === 0)
        return `No memegen generator matched "${query}".`;
    const shown = hits.slice(0, limit);
    const body = shown.map((g, i) => `${i + 1}. ${g.name} (id ${g.id}) — ${g.lines} line${g.lines === 1 ? "" : "s"}, styles: ${g.styles.slice(0, 4).join(", ") || "default"}`);
    return [
        `memegen generators${q ? ` matching "${query}"` : ""} (${hits.length} of ${all.length}):`,
        "",
        ...body,
        "",
        "Pass the id to generate_meme.",
    ].join("\n");
}
export async function generateMeme(template, lines) {
    const all = await allGenerators();
    const id = template.trim().toLowerCase();
    const found = all.find((g) => g.id.toLowerCase() === id || g.name.toLowerCase() === id);
    if (!found) {
        const near = all.filter((g) => g.name.toLowerCase().includes(id) || g.id.includes(id)).slice(0, 8);
        throw new MemeError(near.length
            ? `Unknown generator "${template}". Closest: ${near.map((g) => g.id).join(", ")}`
            : `Unknown generator "${template}" — use list_generators to see the ids`);
    }
    const maxLines = Math.max(found.lines, 1);
    const texts = lines.slice(0, maxLines).map((l) => l.trim());
    if (texts.length > found.lines)
        texts.length = found.lines;
    if (texts.some((t) => t.length === 0))
        throw new MemeError("Each line must have text");
    // memegen wants spaces as underscores inside the path segment.
    const path = texts.map((t) => encodeURIComponent(t.replace(/\s+/g, "_")).replace(/%2F/gi, "-")).join("/");
    const url = `${MEMEGEN}/images/${encodeURIComponent(found.id)}/${path}.jpg`;
    const res = await fetch(url, { method: "HEAD", headers: { "user-agent": "meme-reference-mcp" } });
    if (!res.ok)
        throw new MemeError(`memegen could not render that meme (${res.status})`);
    return [
        `Meme: ${found.name} (${found.id})`,
        `Image: ${url}`,
        `Lines used: ${texts.length} of ${found.lines}`,
        found.source ? `Origin: ${found.source}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}
