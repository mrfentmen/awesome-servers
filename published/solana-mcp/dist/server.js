import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { slot } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "solana-mcp", version: "1.0.0" });
    server.registerTool("slot", {
        title: "Slot",
        description: "Current Solana slot.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await slot(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("solana_supply", {
        title: "Solana supply",
        description: "Total, circulating and non-circulating SOL from the Solana JSON-RPC, which a slot lookup says nothing about.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement supply locally (paywall removed)
        try {
            return textError("Not yet implemented: supply");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("solana_epoch", {
        title: "Solana epoch",
        description: "The current Solana epoch, how far through it is, the absolute slot and block height, and the epoch's transaction count.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement epoch locally (paywall removed)
        try {
            return textError("Not yet implemented: epoch");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("solana_versions", {
        title: "Solana versions",
        description: "The Solana JSON-RPC client's software version, feature set and health status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement versions locally (paywall removed)
        try {
            return textError("Not yet implemented: versions");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "solana-mcp";
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
