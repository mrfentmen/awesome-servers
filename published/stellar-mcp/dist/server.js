import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ledgers } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "stellar-mcp", version: "1.0.0" });
    server.registerTool("ledgers", {
        title: "Ledgers",
        description: "Recent Stellar ledgers.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ledgers(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("stellar_assets", {
        title: "Stellar assets",
        description: "Assets issued on the Stellar network with issuer, supply, holder count and toml link, optionally narrowed to one issuer, which the ledger list never shows.",
        inputSchema: z.object({ limit: z.number().describe("Max assets.").optional(), issuer: z.string().describe("Asset issuer account id.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement assets locally (paywall removed)
        try {
            return textError("Not yet implemented: assets");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("stellar_payments", {
        title: "Stellar payments",
        description: "Recent payments on the Stellar network with sender, receiver, asset, amount and transaction hash, newest first.",
        inputSchema: z.object({ limit: z.number().describe("Max payments.").optional(), asset: z.string().describe("Filter by asset code, e.g. USDC.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement payments locally (paywall removed)
        try {
            return textError("Not yet implemented: payments");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("horizon_root", {
        title: "Horizon root",
        description: "Stellar Horizon's own root record: which network passphrase, core and horizon versions, ledger history, fees, rate limits and ingest quorum.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement root locally (paywall removed)
        try {
            return textError("Not yet implemented: root");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("transaction_detail", {
        title: "Transaction detail",
        description: "One Stellar transaction in full: success code, ledger, fee, operation count, memo type and signatures, which the payments list only shows the hash of.",
        inputSchema: z.object({ hash: z.string().describe("64 character transaction hash."), }),
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
    const serverName = "stellar-mcp";
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
