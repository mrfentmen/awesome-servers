/**
 * memegen.link API client, keyless.
 * Docs: https://api.memegen.link/
 * Image URLs are deterministic: https://api.memegen.link/images/{template}/{top}/{bottom}.png
 */
const BASE = "https://api.memegen.link";
export class MemeError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "memegen-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404)
        throw new MemeError("No such meme template.");
    if (!res.ok)
        throw new MemeError(`memegen.link error ${res.status}`);
    return (await res.json());
}
export async function listTemplates() {
    const rows = await getJson("/templates");
    return rows.map((r) => ({
        id: String(r.id),
        name: String(r.name ?? r.id),
        lines: typeof r.lines === "number" ? r.lines : 2,
        blank: r.blank,
        example: r.example?.url,
    }));
}
export async function getTemplate(id) {
    const clean = id.trim().toLowerCase().replace(/\s+/g, "-");
    const r = await getJson(`/templates/${encodeURIComponent(clean)}`);
    return {
        id: String(r.id ?? clean),
        name: String(r.name ?? clean),
        lines: typeof r.lines === "number" ? r.lines : 2,
        blank: r.blank,
        example: r.example?.url,
    };
}
const slug = (s) => {
    const t = s.trim().replace(/ /g, "_").replace(/[^A-Za-z0-9_~%#'\-.,]/g, "") || "_";
    return t
        .replace(/_/g, "__").replace(/-/g, "--").replace(/~/g, "~~")
        .replace(/%/g, "~p").replace(/#/g, "~h").replace(/"/g, "''");
};
export function makeMeme(template, lines) {
    const clean = template.trim().toLowerCase().replace(/\s+/g, "-");
    if (!/^[a-z0-9-]+$/.test(clean))
        throw new MemeError(`Bad template id: "${template}". Use list_templates.`);
    const parts = lines.slice(0, 8).map(slug);
    while (parts.length === 0)
        parts.push("_");
    return `https://api.memegen.link/images/${clean}/${parts.join("/")}.png`;
}
// ---- gap4d1 tools:
