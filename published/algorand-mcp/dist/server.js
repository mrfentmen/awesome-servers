import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { status, circulatingSupply } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "algorand-mcp", version: "1.0.0" });
    server.registerTool("status", {
        title: "Status",
        description: "Current Algorand status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await status(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("block_detail", {
        title: "Block detail",
        description: "One Algorand block by round: close time, transactions, previous block, seeds and reward addresses.",
        inputSchema: z.object({ round: z.number().describe("Block round. Defaults to the chain head.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement detail locally (paywall removed)
        try {
            return textError("Not yet implemented: detail");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("circulating_supply", {
        title: "Circulating supply",
        description: "Total Algos in circulation on Algorand, with the online money and online stake splits.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await circulatingSupply(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("asset_detail", {
        title: "Asset detail",
        description: "One Algorand asset by ID: name, unit, decimals, supply, manager, reserve and freeze address.",
        inputSchema: z.object({ assetId: z.number().describe("Asset ID, e.g. 31566704 for USDC.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement detail locally (paywall removed)
        try {
            return textError("Not yet implemented: detail");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "algorand-mcp";
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
