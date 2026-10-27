import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { addressInfo, blockInfo, feeEstimates, latestHeight, recentBlocks } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "blockchain-mcp", version: "1.0.0" });
    server.registerTool("latest_height", {
        title: "Latest height",
        description: "Get the latest Bitcoin block height.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await latestHeight(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("block_info", {
        title: "Block info",
        description: "Get info about a Bitcoin block by height.",
        inputSchema: z.object({ height: z.number().describe("Block height.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await blockInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("fee_estimates", {
        title: "Fee estimates",
        description: "Get recommended Bitcoin transaction fee rates.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await feeEstimates(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("address_info", {
        title: "Address info",
        description: "Get info about a Bitcoin address.",
        inputSchema: z.object({ address: z.string().describe("Bitcoin address.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await addressInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("address_transactions", {
        title: "Address transactions",
        description: "Recent transactions touching a Bitcoin address.",
        inputSchema: z.object({ address: z.string().describe("Bitcoin address."), limit: z.number().describe("How many, 1-15.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement transactions locally (paywall removed)
        try {
            return textError("Not yet implemented: transactions");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("mempool_status", {
        title: "Mempool status",
        description: "Current Bitcoin mempool congestion: pending count, backlog size and fee bands.",
        inputSchema: z.object({ bands: z.number().describe("Fee bands to show, 1-10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement status locally (paywall removed)
        try {
            return textError("Not yet implemented: status");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("recent_blocks", {
        title: "Recent blocks",
        description: "The latest Bitcoin blocks with time, transaction count, size, reward and difficulty.",
        inputSchema: z.object({ limit: z.number().describe("How many blocks, 1-15.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recentBlocks(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "blockchain-mcp";
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
    return server;
}
