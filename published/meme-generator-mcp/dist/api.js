const m0 = (() => {
    const UA = "mrfentmen-meme-generator-mcp/1.0 (https://github.com/mrfentmen)";
    const BASE = "https://api.imgflip.com";
    class MemeError extends Error {
    }
    async function get(path) {
        const res = await fetch(`${BASE}${path}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
        if (!res.ok)
            throw new MemeError(`Imgflip returned HTTP ${res.status}`);
        return (await res.json());
    }
    async function templates(args) {
        const data = await get("/get_memes");
        if (!data.success)
            throw new MemeError("Imgflip could not list templates");
        const limit = Math.min(args.limit ?? 15, 50);
        const list = data.data.memes.slice(0, limit);
        return list.map((m, i) => `${i + 1}. ${m.id} | ${m.name} | ${m.width}x${m.height}`).join("\n");
    }
    async function caption(args) {
        const id = (args.template_id ?? "").trim();
        if (!id)
            throw new MemeError("Provide a template ID from the templates tool");
        const top = (args.top ?? "").trim();
        const bottom = (args.bottom ?? "").trim();
        if (!top && !bottom)
            throw new MemeError("Provide at least one caption line");
        const params = new URLSearchParams({ template_id: id, text0: top, text1: bottom });
        const data = await get(`/caption_image?${params.toString()}`);
        if (!data.success || !data.data)
            throw new MemeError(data.error_message ?? "Caption failed");
        return `Meme ready:\n${data.data.url}`;
    }
    return { MemeError, caption, templates };
})();
const m1 = (() => {
    const BASE = 'https://api.imgflip.com/get_memes';
    async function templates(args) {
        const limit = Math.max(1, Math.min(args.limit ?? 20, 100));
        const res = await fetch(BASE, {
            headers: { 'User-Agent': 'mrfentmen-imgflip-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Imgflip returned ${res.status}`);
        const d = (await res.json());
        const rows = (d.data?.memes ?? []).slice(0, limit);
        if (!rows.length)
            return 'No meme templates returned.';
        return `Imgflip meme templates (${rows.length} shown):\n` +
            rows
                .map((r, i) => {
                const s = (k) => (r[k] != null ? String(r[k]) : '');
                return `${i + 1}. ${s('name')} (id ${s('id')})${s('box_count') ? ` | boxes ${s('box_count')}` : ''}`;
            })
                .join('\n');
    }
    return { templates };
})();
export const MemeError = m0.MemeError;
export const caption = m0.caption;
export const templates = m0.templates;
export const m0_MemeError = m0.MemeError;
export const m0_templates = m0.templates;
export const m0_caption = m0.caption;
export const m1_templates = m1.templates;
// ---- muxC tools:
const MEME_UA = "mrfentmen-meme-generator-mcp/1.0 (https://github.com/mrfentmen)";
async function imgflip(path, ms = 25000) {
    const res = await fetch(`https://api.imgflip.com${path}`, { headers: { "User-Agent": MEME_UA, Accept: "application/json" }, signal: AbortSignal.timeout(ms) });
    if (res.status === 429)
        throw new Error("imgflip is rate limiting this client");
    if (!res.ok)
        throw new Error(`imgflip returned ${res.status} for ${path}`);
    return (await res.json());
}
