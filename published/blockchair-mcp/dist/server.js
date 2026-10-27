import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { chain, stats } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "blockchair-mcp", version: "1.0.0" });
    server.registerTool("stats", {
        title: "Stats",
        description: "Bitcoin network stats.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await stats(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("chain", {
        title: "Chain",
        description: "Stats for a chain.",
        inputSchema: z.object({ chain: z.string().describe("Chain like bitcoin.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await chain(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("chain_comparison", {
        title: "Compare several chains side by side",
        description: "Put up to 6 blockchains next to each other from Blockchair: block height, blocks and transactions in the last day, price, market cap, dominance, fee percentiles and mempool depth, then say which leads on market cap and which mempool is busiest.",
        inputSchema: z.object({
            chains: z.string().describe("Up to 6 chain names separated by commas, for example bitcoin, ethereum, dogecoin. Defaults to bitcoin and ethereum.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement comparison locally (paywall removed)
        try {
            return textError("Not yet implemented: comparison");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("mempool_pressure", {
        title: "Mempool and fee pressure",
        description: "Show how congested a chain's mempool is: pending transactions and outputs, throughput, fees locked in the mempool, the suggested fee per byte, last-day fee percentiles, plus hashrate and the next difficulty retarget.",
        inputSchema: z.object({
            chains: z.string().describe("Chain names separated by commas, for example bitcoin, litecoin. Defaults to bitcoin.").optional(),
            chain: z.string().describe("A single chain name, used only when chains is not given.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement pressure locally (paywall removed)
        try {
            return textError("Not yet implemented: pressure");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "blockchair-mcp";
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
