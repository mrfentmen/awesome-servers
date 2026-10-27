import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ScrapeError, fillerEpisodeList, fillerRunAnalysis, getShow, searchAnime, verdict } from "./scraper.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "anime-filler-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_anime", {
        title: "Search anime",
        description: "Search for an anime on animefillerlist.com and return its slug " +
            "for the other tools.",
        inputSchema: z.object({ query: z.string().describe("Anime title, e.g. 'Naruto Shippuden' or 'One Piece'") }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            const results = await searchAnime(query);
            if (results.length === 0) {
                return text(`No anime found for "${query}".`);
            }
            return text(`Anime matching "${query}":\n` +
                results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.url} (slug: ${r.slug})`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_episode_lists", {
        title: "Get episode lists",
        description: "Get the full canon/filler episode breakdown for an anime by slug.",
        inputSchema: z.object({ slug: z.string().describe("Anime slug from search_anime, e.g. 'naruto-shippuden'") }),
        annotations: READ_ONLY,
    }, async ({ slug }) => {
        try {
            const info = await getShow(slug);
            const head = `${info.title} — ${info.totalEpisodes ? info.totalEpisodes + " episodes" : "?"}` +
                (info.status ? `, ${info.status}` : "") +
                `\n${info.url}\n`;
            if (info.categories.length === 0) {
                return text(head + "No episode categories could be parsed from the page.");
            }
            const body = info.categories
                .map((c) => `• ${c.label} (${c.episodes.length} eps): ${formatRanges(c.episodes)}`)
                .join("\n");
            const sample = info.episodes.length > 0
                ? `\n\nSample (first 8):\n` +
                    info.episodes
                        .slice(0, 8)
                        .map((e) => `  ep${e.number} [${e.category}] ${e.title}`)
                        .join("\n")
                : "";
            return text(head + "\n" + body + sample);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("is_episode_filler", {
        title: "Is episode filler",
        description: "Ask whether a specific episode is filler or canon. The question every weeb asks.",
        inputSchema: z.object({
            slug: z.string().describe("Anime slug from search_anime"),
            episode: z.number().int().min(1).describe("Episode number"),
        }),
        annotations: READ_ONLY,
    }, async ({ slug, episode }) => {
        try {
            const info = await getShow(slug);
            return text(verdict(info, episode));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("filler_run_analysis", {
        title: "Filler run analysis",
        description: "How much of a show is filler, and the longest unbroken stretch of episodes you can skip.",
        inputSchema: z.object({ slug: z.string().describe("Anime slug from search_anime, e.g. 'naruto-shippuden'") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await fillerRunAnalysis(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("filler_episode_list", {
        title: "Filler episode list",
        description: "Just the skippable episodes of a show, with episode numbers and titles.",
        inputSchema: z.object({
            slug: z.string().describe("Anime slug from search_anime"),
            limit: z.number().describe("Max filler episodes to list.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await fillerEpisodeList(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "anime-filler-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    server.registerTool("timestamp", {
        title: "Timestamp",
        description: "Get the current UTC timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(new Date().toISOString());
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof ScrapeError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
/** Compact "1-17, 20-21, 35" representation of a sorted episode list. */
function formatRanges(nums) {
    if (nums.length === 0)
        return "—";
    const parts = [];
    let start = nums[0];
    let prev = nums[0];
    for (let i = 1; i <= nums.length; i++) {
        const n = nums[i];
        if (n === prev + 1) {
            prev = n;
            continue;
        }
        parts.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = prev = n;
    }
    const s = parts.join(", ");
    return s.length > 160 ? s.slice(0, 157) + "…" : s;
}
