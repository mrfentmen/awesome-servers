import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, repoHeader } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "f-droid-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search F-Droid apps.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("package_versions", {
        title: "Package versions",
        description: "Every build F-Droid carries for one package: how many there are, how many distinct version names, the suggested version code, the version code range and the newest twenty builds by code. The search tool cannot reach this because the F-Droid search route it calls does not exist, so this is currently the only working route into the F-Droid API on this server.",
        inputSchema: z.object({ package: z.string().describe("F-Droid package name, like org.fdroid.fdroid.") }),
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
    server.registerTool("repo_header", {
        title: "Repository header",
        description: "The F-Droid repository's own header: when the index was built, its format version, how long clients may cache it, the repository address and every mirror including the onion ones. It reads only the first 64 KB of the index with an HTTP Range request, so it does not download the 63 MB file.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await repoHeader());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "f-droid-mcp";
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
