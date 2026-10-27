import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { domains } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "mail-tm-mcp", version: "1.0.0" });
    server.registerTool("domains", {
        title: "Domains",
        description: "List available domains.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await domains(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("inbox", {
        title: "Inbox",
        description: "List the messages waiting in a mail.tm inbox. The address and password are the credential; nothing is created or deleted.",
        inputSchema: z.object({ address: z.string().describe("mail.tm address."), password: z.string().describe("mail.tm password."), limit: z.number().describe("Max messages.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement inbox locally (paywall removed)
        try {
            return textError("Not yet implemented: inbox");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("read_message", {
        title: "Read message",
        description: "One message from a mail.tm inbox in full, with its body text. Takes the message id from the inbox listing.",
        inputSchema: z.object({ address: z.string().describe("mail.tm address."), password: z.string().describe("mail.tm password."), message_id: z.string().describe("Message id from the inbox listing.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement message locally (paywall removed)
        try {
            return textError("Not yet implemented: message");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "mail-tm-mcp";
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
