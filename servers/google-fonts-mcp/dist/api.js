export class GFontsError extends Error {
    constructor(message) {
        super(message);
        this.name = "GFontsError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function key() {
    const k = process.env.GOOGLE_FONTS_KEY;
    if (!k)
        throw new GFontsError("Set GOOGLE_FONTS_KEY (free Google API key).");
    return k;
}
async function list() {
    let res;
    try {
        res = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${encodeURIComponent(key())}&sort=popularity`, {
            headers: { ...UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new GFontsError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new GFontsError(`HTTP ${res.status}: ${body}`);
    }
    const d = (await res.json());
    return d.items ?? [];
}
export async function listFonts(limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 100);
    const items = await list();
    return JSON.stringify(items.slice(0, n).map((f) => ({ family: f.family, category: f.category, variants: f.variants })), null, 2);
}
export async function searchFonts(query, limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 100);
    const q = query.toLowerCase();
    const items = await list();
    const hits = items.filter((f) => f.family.toLowerCase().includes(q)).slice(0, n);
    return JSON.stringify(hits.map((f) => ({ family: f.family, category: f.category, variants: f.variants })), null, 2);
}
export async function getFont(family) {
    const items = await list();
    const f = items.find((x) => x.family.toLowerCase() === family.toLowerCase());
    if (!f)
        throw new GFontsError(`Font not found: ${family}.`);
    return JSON.stringify(f, null, 2);
}
// ---- muxG tools:
const GF_METADATA = "https://fonts.google.com/metadata/fonts";
const GF_CSS = "https://fonts.googleapis.com/css2";
const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
async function gfMetadata() {
    let res;
    try {
        res = await fetch(GF_METADATA, { headers: { ...UA, Accept: "application/json", "User-Agent": CHROME_UA }, signal: AbortSignal.timeout(30000) });
    }
    catch (e) {
        throw new GFontsError(`Network error: ${e.message}`);
    }
    if (!res.ok)
        throw new GFontsError(`Google Fonts metadata returned ${res.status}`);
    const body = await res.text();
    if (!body.trim())
        throw new GFontsError("Google Fonts metadata returned an empty body.");
    return JSON.parse(body);
}
/** The variable-font axes Google Fonts actually exposes, and which families use them. */
export async function variableAxes(args) {
    const data = await gfMetadata();
    const families = Array.isArray(data.familyMetadataList) ? data.familyMetadataList : [];
    if (!families.length)
        throw new GFontsError("Google Fonts metadata returned no families.");
    const wanted = String(args.family ?? "").trim();
    if (wanted) {
        const match = families.find((f) => (f.family ?? "").toLowerCase() === wanted.toLowerCase());
        if (!match)
            throw new GFontsError(`Font not found in the Google Fonts metadata: ${wanted}.`);
        const axes = match.axes ?? [];
        const lines = [
            `${match.family}${match.category ? ` (${match.category})` : ""} — ${axes.length ? `${axes.length} variable axis/axes` : "no variable axes; this family is static"}`,
            match.designers?.length ? `Designer: ${match.designers.join(", ")}` : "Designer: not reported",
        ];
        if (!axes.length)
            return lines.join("\n");
        for (const axis of axes) {
            lines.push(`  ${axis.tag ?? "?"} — ${axis.displayName ?? "axis not named"}: ${axis.min ?? "?"} to ${axis.max ?? "?"}, default ${axis.defaultValue ?? "?"}${axis.precision ? `, step ${axis.precision}` : ""}`);
            if (axis.description)
                lines.push(`     ${axis.description.slice(0, 200)}`);
        }
        return lines.join("\n");
    }
    const n = Math.min(Math.max(Number(args.limit ?? 12) || 12, 1), 25);
    const registry = Array.isArray(data.axisRegistry) ? data.axisRegistry : [];
    const variable = families.filter((f) => Array.isArray(f.axes) && f.axes.length);
    const usage = new Map();
    for (const family of variable) {
        for (const axis of family.axes ?? []) {
            const tag = axis.tag ?? "?";
            usage.set(tag, (usage.get(tag) ?? 0) + 1);
        }
    }
    const lines = [
        `Google Fonts variable axes: ${registry.length} registered axis/axes across ${variable.length} of ${families.length} families`,
        "",
        "Axis registry:",
    ];
    for (const axis of registry.slice(0, 12)) {
        lines.push(`  ${(axis.tag ?? "?").padEnd(5)} ${axis.displayName ?? "unnamed"}: ${axis.min ?? "?"} to ${axis.max ?? "?"}, default ${axis.defaultValue ?? "?"} · used by ${usage.get(axis.tag ?? "") ?? 0} families`);
    }
    if (registry.length > 12)
        lines.push(`  ...and ${registry.length - 12} more axis/axes in the registry.`);
    lines.push("");
    lines.push(`Most-used families on this list:`);
    for (const family of variable.slice(0, n)) {
        const tags = (family.axes ?? []).map((a) => `${a.tag} ${a.min ?? "?"}-${a.max ?? "?"}`).join(", ");
        lines.push(`  ${family.family ?? "unnamed"}${family.category ? ` (${family.category})` : ""}: ${tags}`);
    }
    return lines.join("\n");
}
const WEIGHTS = ["100", "200", "300", "400", "500", "600", "700", "800", "900"];
/** The @font-face CSS Google actually serves for a family, which is what a browser ends up downloading. */
export async function servedFontFaces(args) {
    const family = String(args.family ?? "").trim();
    if (!family)
        throw new GFontsError("Provide a font family, e.g. Inter.");
    if (!/^[A-Za-z0-9 ]{1,60}$/.test(family))
        throw new GFontsError(`"${family}" is not a plausible family name.`);
    const asked = String(args.weights ?? "")
        .split(/[,\s]+/)
        .map((w) => w.trim())
        .filter(Boolean);
    const weights = asked.length ? asked : ["400"];
    const bad = weights.filter((w) => !WEIGHTS.includes(w));
    if (bad.length)
        throw new GFontsError(`Weights must be numeric from 100 to 900 in hundreds; rejected: ${bad.join(", ")}.`);
    // css2 wants the axis tag written once, then a semicolon separated weight list
    const spec = `wght@${weights.join(";")}`;
    let res;
    try {
        res = await fetch(`${GF_CSS}?family=${encodeURIComponent(family)}:${spec}&display=swap`, {
            headers: { Accept: "text/css", "User-Agent": CHROME_UA },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new GFontsError(`Network error: ${e.message}`);
    }
    if (res.status === 400)
        throw new GFontsError(`Google Fonts refused that request (400) - unknown family or weight.`);
    if (!res.ok)
        throw new GFontsError(`Google Fonts stylesheet returned ${res.status}`);
    const css = await res.text();
    if (!css.trim())
        throw new GFontsError("Google Fonts returned an empty stylesheet for that family.");
    // each rule is preceded by a /* subset */ comment, so pair them up in one pass
    const faces = Array.from(css.matchAll(/\/\*\s*([^ *]+?)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g));
    if (!faces.length)
        throw new GFontsError(`No @font-face rules came back for ${family}.`);
    const formats = new Set();
    const subsets = [];
    const lines = [`${family}: ${faces.length} @font-face rule(s) served for weight(s) ${weights.join(", ")}`];
    let shown = 0;
    for (const face of faces) {
        const subset = face[1];
        const body = face[2];
        const weight = (body.match(/font-weight:\s*([^;]+);/) ?? [])[1]?.trim() ?? "not reported";
        const style = (body.match(/font-style:\s*([^;]+);/) ?? [])[1]?.trim() ?? "normal";
        const display = (body.match(/font-display:\s*([^;]+);/) ?? [])[1]?.trim() ?? "not reported";
        const src = (body.match(/url\(([^)]+)\)\s*format\('([^']+)'\)/) ?? []);
        if (src[2])
            formats.add(src[2]);
        if (subset)
            subsets.push(subset);
        if (shown < 8) {
            lines.push(`  ${subset} · weight ${weight} ${style}, font-display ${display} → ${src[2] ?? "format not reported"}${src[1] ? ` ${src[1].slice(0, 80)}` : ""}`);
            shown += 1;
        }
    }
    if (faces.length > shown)
        lines.push(`  ...and ${faces.length - shown} more rule(s), which are the other subsets.`);
    lines.push("");
    lines.push(`Formats served: ${formats.size ? Array.from(formats).join(", ") : "not reported"}`);
    lines.push(`Subsets in this stylesheet (${subsets.length}): ${subsets.length ? subsets.slice(0, 12).join(", ") : "not reported"}${subsets.length > 12 ? ", ..." : ""}`);
    return lines.join("\n");
}
