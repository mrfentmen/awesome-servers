import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WikiError, getPageWikitext, getSubpages, searchPages } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "walkthrough-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_games", {
        title: "Search games",
        description: "Search StrategyWiki for games and guides by title. Returns page " +
            "titles to pass to the other tools.",
        inputSchema: z.object({ query: z.string().describe("Game title, e.g. 'Ocarina of Time' or 'Final Fantasy VII'") }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            const results = await searchPages(query);
            if (results.length === 0)
                return text(`No results found for "${query}".`);
            return text(`StrategyWiki matches for "${query}":\n` +
                results
                    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}${r.snippet ? `\n   ${r.snippet.slice(0, 120)}` : ""}`)
                    .join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_game_pages", {
        title: "Get game pages",
        description: "List the subpages of a game page — typically a Walkthrough, plus " +
            "cheats/guides sections. Pass any returned page title to get_guide.",
        inputSchema: z.object({
            title: z.string().describe("Game page title from search_games, e.g. 'The Legend of Zelda: Ocarina of Time'"),
        }),
        annotations: READ_ONLY,
    }, async ({ title }) => {
        try {
            const subpages = await getSubpages(title);
            if (subpages.length === 0) {
                return text(`No subpages found for "${title}". Try search_games to find the exact page title.`);
            }
            return text(`Pages under "${title}":\n` +
                subpages
                    .map((p, i) => `${i + 1}. ${p.title}\n   ${p.url}`)
                    .join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_guide", {
        title: "Get guide",
        description: "Fetch the full text of a walkthrough, FAQ, or cheat guide page.",
        inputSchema: z.object({
            title: z.string().describe("Page title from search_games / get_game_pages, e.g. 'The Legend of Zelda: Ocarina of Time/Walkthrough'"),
            maxChars: z
                .number()
                .int()
                .min(500)
                .max(40000)
                .default(12000)
                .describe("Max characters of guide text to return"),
        }),
        annotations: READ_ONLY,
    }, async ({ title, maxChars }) => {
        try {
            const content = await getPageWikitext(title);
            const truncated = content.length > maxChars
                ? content.slice(0, maxChars) +
                    `\n…[truncated — full page is ${content.length} chars]`
                : content;
            return text(truncated);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "walkthrough-mcp";
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
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof WikiError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
