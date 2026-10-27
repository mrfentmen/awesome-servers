import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { resolve, ensMetadata } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "ensideas-mcp", version: "1.0.0" });
    server.registerTool("resolve", {
        title: "Resolve",
        description: "Resolve an ENS name to an address.",
        inputSchema: z.object({ name: z.string().describe("ENS name like vitalik.eth.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await resolve(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("address_profile", {
        title: "Address profile",
        description: "The on chain account behind an ENS name or a 0x address: whether it is a contract, whether its source is verified, its exact balance in wei and ETH, its creator and creation transaction, its proxy type and implementations, and its reverse ENS name. The resolve tool only says which address a name points at, never anything about that address.",
        inputSchema: z.object({ name: z.string().describe("ENS name like vitalik.eth. Omit if you give an address.").optional(), address: z.string().describe("0x address of forty hex characters. Omit if you give a name.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ens_metadata", {
        title: "ENS metadata",
        description: "The full ENS record for a name from the metadata service: the content hash, the resolver contract, the avatar at three sizes, the header image, the description, every chain the name publishes a wallet for and every other text record such as url, twitter, github and email. The resolve tool reads four fields and cannot see any of the rest.",
        inputSchema: z.object({ name: z.string().describe("ENS name like vitalik.eth.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ensMetadata(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ensideas-mcp";
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
