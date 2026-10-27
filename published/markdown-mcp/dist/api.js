import { marked } from "marked";
export class MdError extends Error {
}
export async function toHtml(args) {
    const md = args.markdown ?? "";
    if (!md.trim())
        throw new MdError("Provide markdown text");
    const html = await marked.parse(md);
    return html.slice(0, 8000);
}
export async function headings(args) {
    const md = args.markdown ?? "";
    const lines = md.split("\n");
    const out = [];
    for (const line of lines) {
        const m = /^(#{1,6})\s+(.*)$/.exec(line);
        if (m)
            out.push(`${"  ".repeat(m[1].length - 1)}${m[1].length}. ${m[2]}`);
    }
    return out.join("\n") || "No headings found";
}
// ---- muxC tools:
// ---- gap4d1 tools:
async function markdownGithub(path) {
    const res = await fetch(`https://api.github.com${path}`, {
        headers: { "User-Agent": "mrfentmen-markdown-mcp/1.0", Accept: "application/vnd.github+json" },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new MdError(`GitHub returned HTTP ${res.status}`);
    return await res.json();
}
export async function emojiShortcodes(args) {
    const data = await markdownGithub("/emojis");
    const query = (args.query ?? "").toLowerCase();
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 15), 40));
    const rows = Object.entries(data).filter(([name]) => name.includes(query));
    return `GitHub Markdown emoji shortcodes: ${rows.length} matches\n` + rows.slice(0, limit).map(([name, url]) => `:${name.slice(0, 100)}: | ${String(url).slice(0, 400)}`).join("\n");
}
