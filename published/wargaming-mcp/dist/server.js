import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchWotAccounts, getWotAccount, getWotTanks, searchWotClans, searchWowsAccounts, getWowsAccount, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "wargaming-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_wot_accounts", {
        title: "Search WoT accounts",
        description: "Find World of Tanks accounts by nickname.",
        inputSchema: z.object({
            search: z.string().describe("Nickname search"),
            limit: z.number().default(5).describe("How many results"),
        }),
        annotations: READ_ONLY,
    }, async ({ search, limit }) => {
        try {
            return text(await searchWotAccounts(search, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_wot_account", {
        title: "Get WoT account",
        description: "World of Tanks account details: battles, wins, XP, clan, per-mode stats.",
        inputSchema: z.object({
            accountId: z.string().describe("Account id"),
        }),
        annotations: READ_ONLY,
    }, async ({ accountId }) => {
        try {
            return text(await getWotAccount(accountId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_wot_tanks", {
        title: "Get WoT tank stats",
        description: "Per-vehicle World of Tanks stats for an account: battles, wins, damage, frags.",
        inputSchema: z.object({
            accountId: z.string().describe("Account id"),
        }),
        annotations: READ_ONLY,
    }, async ({ accountId }) => {
        try {
            return text(await getWotTanks(accountId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_wot_clans", {
        title: "Search WoT clans",
        description: "Find World of Tanks clans by name or tag.",
        inputSchema: z.object({
            search: z.string().describe("Clan search"),
            limit: z.number().default(5).describe("How many results"),
        }),
        annotations: READ_ONLY,
    }, async ({ search, limit }) => {
        try {
            return text(await searchWotClans(search, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_wows_accounts", {
        title: "Search WoWS accounts",
        description: "Find World of Warships accounts by nickname.",
        inputSchema: z.object({
            search: z.string().describe("Nickname search"),
            limit: z.number().default(5).describe("How many results"),
        }),
        annotations: READ_ONLY,
    }, async ({ search, limit }) => {
        try {
            return text(await searchWowsAccounts(search, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_wows_account", {
        title: "Get WoWS account",
        description: "World of Warships account details: battles, wins, damage, clan, per-mode stats.",
        inputSchema: z.object({
            accountId: z.string().describe("Account id"),
        }),
        annotations: READ_ONLY,
    }, async ({ accountId }) => {
        try {
            return text(await getWowsAccount(accountId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "wargaming-mcp";
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
