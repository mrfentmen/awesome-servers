import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { addressBalance, blockInfo, txInfo, recentTransactions } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "blockcypher-mcp", version: "1.0.0" });
    server.registerTool("address_balance", {
        title: "Address balance",
        description: "Get address balance for a coin.",
        inputSchema: z.object({ coin: z.string().describe("Coin symbol (btc, eth, ltc, doge)."), address: z.string().describe("Address to query.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await addressBalance(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("block_info", {
        title: "Block info",
        description: "Get block details.",
        inputSchema: z.object({ coin: z.string().describe("Coin symbol."), height: z.string().describe("Block height or hash.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await blockInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("tx_info", {
        title: "Tx info",
        description: "Get transaction details.",
        inputSchema: z.object({ coin: z.string().describe("Coin symbol."), txid: z.string().describe("Transaction hash.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await txInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("chain_status", {
        title: "Chain status",
        description: "Height, latest block, peers, mempool size and current fee or gas estimates for one chain, in the units that chain uses.",
        inputSchema: z.object({ coin: z.string().describe("Coin symbol (btc, eth, ltc, doge).") }),
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
    server.registerTool("address_activity", {
        title: "Address activity",
        description: "An address with its confirmed totals plus its most recent transactions, converted with the right decimals for the coin.",
        inputSchema: z.object({ coin: z.string().describe("Coin symbol (btc, eth, ltc, doge)."), address: z.string().describe("Address to inspect."), limit: z.number().describe("How many recent transactions to list, 1-25. Defaults to 5.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement activity locally (paywall removed)
        try {
            return textError("Not yet implemented: activity");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("recent_transactions", {
        title: "Recent transactions",
        description: "The newest transactions BlockCypher sees on a chain, with how many are still unconfirmed and the total value and fees moved.",
        inputSchema: z.object({ coin: z.string().describe("Coin symbol (btc, eth, ltc, doge)."), limit: z.number().describe("How many to list, 1-50. Defaults to 10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recentTransactions(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "blockcypher-mcp";
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
