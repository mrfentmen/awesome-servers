import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { EmbyError, formatLibrary, formatUser, listLibraries, listUsers, serverInfo } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "emby-mcp",
        version: "1.0.0",
    });
    server.registerTool("server_info", {
        title: "Server info",
        description: "Public Emby server info: name, version. No key needed. Set EMBY_URL for non-default hosts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const info = await serverInfo();
            return text(`${info.name ?? "Emby"}${info.version ? ` ${info.version}` : ""}${info.id ? `\nId: ${info.id}` : ""}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_users", {
        title: "List users",
        description: "Users on the server with admin flags and activity. Needs EMBY_API_KEY.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const rows = await listUsers();
            if (rows.length === 0)
                return text("No users.");
            return text(rows.map((u, i) => formatUser(u, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_libraries", {
        title: "List libraries",
        description: "Media libraries with collection types. Needs EMBY_API_KEY.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const rows = await listLibraries();
            if (rows.length === 0)
                return text("No libraries.");
            return text(rows.map((l, i) => formatLibrary(l, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "emby-mcp";
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
function errorMessage(e) {
    if (e instanceof EmbyError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
