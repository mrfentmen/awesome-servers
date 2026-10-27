import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGrant, listCalendars, listMessages, grantFlowAudit, messageObjectAudit } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "nylas-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_grant", {
        title: "Grant info",
        description: "Which account the grant connects, and its provider.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getGrant());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_calendars", {
        title: "List calendars",
        description: "Calendars on the grant, with id and name.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listCalendars(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_messages", {
        title: "List messages",
        description: "Recent email messages, newest first.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listMessages(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("grant_flow_audit", {
        title: "Grant flow audit",
        description: "What a Nylas grant can be asked to do, read from the published API document: every security scheme and what it is for, the scopes the flow definitions document, the auth and token operations, and which scopes each operation asks for, with the most demanded scopes ranked.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(30).default(10).describe("Operations to print (default 10, max 30).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await grantFlowAudit(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("message_object_audit", {
        title: "Message object audit",
        description: "The shape of the message object Nylas returns, from the published schema: every field with its type, which are required, which carry a description, and which constrain their value with an enum, so you know what can be null before you read it.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(40).default(14).describe("Fields to print (default 14, max 40).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await messageObjectAudit(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "nylas-mcp";
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
