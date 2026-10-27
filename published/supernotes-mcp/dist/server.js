import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCard, selectCards, simpleCreateCard, checkAuth, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const MUTATING = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "supernotes-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_card", {
        title: "Get card",
        description: "SuperNotes card by UUID.",
        inputSchema: z.object({
            card_id: z.string().describe("Card UUID.")
        }),
        annotations: READ_ONLY,
    }, async ({ card_id }) => {
        try {
            return text(await getCard(card_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("select_cards", {
        title: "Search cards",
        description: "Search/select cards with optional query and limit.",
        inputSchema: z.object({
            search: z.string().describe("Search text.").optional(),
            limit: z.string().describe("Max cards.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ search, limit }) => {
        try {
            return text(await selectCards(search, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("simple_create_card", {
        title: "Create card",
        description: "Create a card with name/markup.",
        inputSchema: z.object({
            name: z.string().describe("Card title.").optional(),
            markup: z.string().describe("Card markdown content.").optional()
        }),
        annotations: MUTATING,
    }, async ({ name, markup }) => {
        try {
            return text(await simpleCreateCard(name, markup));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("check_auth", {
        title: "Check auth",
        description: "Validate the API key, returns user ID.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await checkAuth());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "supernotes-mcp";
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
    return server;
}
