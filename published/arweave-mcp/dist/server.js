import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ArweaveError, networkInfo, storagePrice, priceTable, txStatus, walletBalance, searchByTag, addressTransactions, blockDetail } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "arweave-mcp",
        version: "1.0.0",
    });
    server.registerTool("network_info", {
        title: "Network info",
        description: "Arweave network: height, peers, queue. Set ARWEAVE_URL for other gateways.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(await networkInfo());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("tx_status", {
        title: "Transaction status",
        description: "Check if an Arweave transaction is confirmed and in which block.",
        inputSchema: z.object({
            id: z.string().describe("Transaction id (43 chars)"),
        }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            return text(await txStatus(id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("wallet_balance", {
        title: "Wallet balance",
        description: "AR balance of a wallet address.",
        inputSchema: z.object({
            address: z.string().describe("Wallet address (43 chars)"),
        }),
        annotations: READ_ONLY,
    }, async ({ address }) => {
        try {
            return text(await walletBalance(address));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("storage_price", {
        title: "Storage price",
        description: "What storing N bytes costs in AR right now.",
        inputSchema: z.object({
            bytes: z.number().positive().describe("Bytes to store, e.g. 1048576 for 1 MB"),
        }),
        annotations: READ_ONLY,
    }, async ({ bytes }) => {
        try {
            return text(await storagePrice(bytes));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_by_tag", {
        title: "Search transactions by tag",
        description: "Find Arweave transactions by a tag pair, which is how permanent apps label their data, for example App-Name=ArDrive or Content-Type=image/png.",
        inputSchema: z.object({
            tag: z.string().describe("Tag name, e.g. 'App-Name' or 'Content-Type'"),
            value: z.string().describe("Tag value, e.g. 'ArDrive' or 'image/png' (the gateway requires a value)"),
            limit: z.number().describe("How many transactions to return, 1-50. Defaults to 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ tag, value, limit }) => {
        try {
            return text(await searchByTag({ tag, value, limit }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("address_transactions", {
        title: "Address transactions",
        description: "The newest transactions written by one Arweave address, with confirmation height, data size, content type and the tags that identify each upload.",
        inputSchema: z.object({
            address: z.string().describe("43-character Arweave address, e.g. FPjbN_btYKzcf8QASjs30v5C0FPv7XpwKXENBW8dqVw"),
            limit: z.number().describe("How many transactions to return, 1-50. Defaults to 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ address, limit }) => {
        try {
            return text(await addressTransactions({ address, limit }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("block_detail", {
        title: "Block detail",
        description: "One Arweave block in full: mining reward in AR, transaction count, block and weave size, nonce, difficulty and the previous block hash.",
        inputSchema: z.object({
            height: z.string().describe("Block height, or 'current' for the tip. Defaults to current.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ height }) => {
        try {
            return text(await blockDetail({ height }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("price_table", {
        title: "Price table",
        description: "The Arweave storage price for a whole range of file sizes at once, converted from winston to AR, which is how you price an upload before sending it.",
        inputSchema: z.object({ sizesMb: z.array(z.number()).describe("Sizes in megabytes, e.g. [1,10,100].").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await priceTable(args?.sizesMb));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "arweave-mcp";
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
    return server;
}
function errorMessage(e) {
    if (e instanceof ArweaveError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
