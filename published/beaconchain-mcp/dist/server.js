import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getChainState, getValidatorRewards, getLatestEpoch, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "beaconchain-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_chain_state", {
        title: "Get chain state",
        description: "Current Ethereum beacon chain state from beaconcha.in.",
        inputSchema: z.object({
            chain: z.string().default("mainnet").describe("Chain: mainnet or hoodi"),
        }),
        annotations: READ_ONLY,
    }, async ({ chain }) => {
        try {
            return text(await getChainState(chain));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_validator_rewards", {
        title: "Get validator rewards",
        description: "Rewards for beacon chain validators by index.",
        inputSchema: z.object({
            validators: z.string().describe("Comma-separated validator indices, e.g. '1,2,3'"),
            epoch: z.number().optional().describe("Epoch number, default latest"),
            chain: z.string().default("mainnet").describe("Chain"),
        }),
        annotations: READ_ONLY,
    }, async ({ validators, epoch, chain }) => {
        try {
            return text(await getValidatorRewards(validators, epoch, chain));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_latest_epoch", {
        title: "Get latest epoch",
        description: "Latest beacon chain epoch summary (V1 API).",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getLatestEpoch());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "beaconchain-mcp";
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
