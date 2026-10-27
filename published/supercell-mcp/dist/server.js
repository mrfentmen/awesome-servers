import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCocPlayer, getCocClan, searchCocClans, getRoyalePlayer, getRoyaleClan, getRoyaleTopClans, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "supercell-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_coc_player", {
        title: "Get CoC player",
        description: "Clash of Clans player profile: town hall, trophies, troops, achievements, clan.",
        inputSchema: z.object({
            tag: z.string().describe("Player tag with or without '#'"),
        }),
        annotations: READ_ONLY,
    }, async ({ tag }) => {
        try {
            return text(await getCocPlayer(tag));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_coc_clan", {
        title: "Get CoC clan",
        description: "Clash of Clans clan: level, points, war record, member list.",
        inputSchema: z.object({
            tag: z.string().describe("Clan tag with or without '#'"),
        }),
        annotations: READ_ONLY,
    }, async ({ tag }) => {
        try {
            return text(await getCocClan(tag));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_coc_clans", {
        title: "Search CoC clans",
        description: "Search Clash of Clans clans by name.",
        inputSchema: z.object({
            name: z.string().describe("Clan name search"),
            limit: z.number().default(5).describe("How many results"),
        }),
        annotations: READ_ONLY,
    }, async ({ name, limit }) => {
        try {
            return text(await searchCocClans(name, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_royale_player", {
        title: "Get Royale player",
        description: "Clash Royale player profile: trophies, wins, cards, current deck, clan.",
        inputSchema: z.object({
            tag: z.string().describe("Player tag with or without '#'"),
        }),
        annotations: READ_ONLY,
    }, async ({ tag }) => {
        try {
            return text(await getRoyalePlayer(tag));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_royale_clan", {
        title: "Get Royale clan",
        description: "Clash Royale clan: score, donations, member list.",
        inputSchema: z.object({
            tag: z.string().describe("Clan tag with or without '#'"),
        }),
        annotations: READ_ONLY,
    }, async ({ tag }) => {
        try {
            return text(await getRoyaleClan(tag));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_royale_top_clans", {
        title: "Get top Royale clans",
        description: "Top Clash Royale clans for a location ranking.",
        inputSchema: z.object({
            locationId: z.string().default("global").describe("Location id, 'global' or numeric"),
            limit: z.number().default(5).describe("How many entries"),
        }),
        annotations: READ_ONLY,
    }, async ({ locationId, limit }) => {
        try {
            return text(await getRoyaleTopClans(locationId, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "supercell-mcp";
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
