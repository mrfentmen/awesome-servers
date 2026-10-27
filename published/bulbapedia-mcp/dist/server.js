import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BulbapediaError, formatArticle, getArticle, randomArticle, searchArticles, pageLinks } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "bulbapedia-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_articles", {
        title: "Search Bulbapedia",
        description: "Search Bulbapedia: Pokemon species, moves, abilities, characters, episodes, TCG sets.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'Pikachu', 'Thunderbolt move', 'Scarlet Violet'"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const results = await searchArticles(query, limit);
            if (results.length === 0)
                return text(`No Bulbapedia articles match "${query}".`);
            return text(`Bulbapedia results for "${query}":\n\n${results.map((h, i) => `${i + 1}. ${h.title}${h.snippet ? ` — ${h.snippet.slice(0, 140)}` : ""}`).join("\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_article", {
        title: "Get article",
        description: "Get a Bulbapedia article summary: intro text plus wiki link.",
        inputSchema: z.object({
            title: z.string().describe("Exact article title, e.g. 'Pikachu (Pokémon)' (use search_articles to find it)"),
        }),
        annotations: READ_ONLY,
    }, async ({ title }) => {
        try {
            const a = await getArticle(title);
            if (!a)
                return text(`No Bulbapedia article titled "${title}".`);
            return text(formatArticle(a));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("random_article", {
        title: "Random article",
        description: "Open a random Bulbapedia article. Great for discovering obscure Pokemon and lore.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const { title } = await randomArticle();
            const a = await getArticle(title);
            if (!a)
                return text(`Random pick: ${title}`);
            return text(formatArticle(a));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("page_details", {
        title: "Page details",
        description: "Full page metadata for a Bulbapedia article beyond its intro text: page id, canonical URL, byte length, last touch and revision with editor, linked Wikidata item and every category the page sits in.",
        inputSchema: z.object({ title: z.string().describe("Page title, e.g. Pikachu.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement details locally (paywall removed)
        try {
            return textError("Not yet implemented: details");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("category_members", {
        title: "Category members",
        description: "List the pages inside any Bulbapedia category, automatically adding the Category prefix, reporting how many members the API returned and whether more pages of results exist.",
        inputSchema: z.object({ category: z.string().describe("Category name, e.g. Pokémon or Type:Electric."), limit: z.number().describe("Max members.").optional(), namespace: z.number().describe("Restrict to one namespace id.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement members locally (paywall removed)
        try {
            return textError("Not yet implemented: members");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("page_links", {
        title: "Page links",
        description: "Outbound wiki links and images used by a Bulbapedia page, with any redirect the title resolved through, useful for tracing how an article connects to the rest of the site.",
        inputSchema: z.object({ title: z.string().describe("Page title, e.g. Pikachu."), limit: z.number().describe("Max links and images.").optional(), redirects: z.boolean().describe("Follow redirects.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await pageLinks(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    const serverName = "bulbapedia-mcp";
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
    return server;
}
function errorMessage(e) {
    if (e instanceof BulbapediaError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
