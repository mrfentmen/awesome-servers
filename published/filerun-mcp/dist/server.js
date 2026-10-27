import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { browseFolder, searchFiles, createFolder, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const MUTATING = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "filerun-mcp",
        version: "1.0.0",
    });
    server.registerTool("browse_folder", {
        title: "Browse folder",
        description: "List files and folders in a FileRun path (requires FILERUN_ACCESS_TOKEN).",
        inputSchema: z.object({
            path: z.string().describe("FileRun folder path.")
        }),
        annotations: READ_ONLY,
    }, async ({ path }) => {
        try {
            return text(await browseFolder(path));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_files", {
        title: "Search files",
        description: "Search file/folder names or contents under a path.",
        inputSchema: z.object({
            path: z.string().describe("FileRun folder path to search in."),
            filename: z.string().describe("Keyword for file/folder names.").optional(),
            contents: z.string().describe("Keyword for file contents (no other criteria).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ path, filename, contents }) => {
        try {
            return text(await searchFiles(path, filename, contents));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("create_folder", {
        title: "Create folder",
        description: "Create a folder (requires upload scope).",
        inputSchema: z.object({
            path: z.string().describe("Parent folder path."),
            name: z.string().describe("New folder name.")
        }),
        annotations: MUTATING,
    }, async ({ path, name }) => {
        try {
            return text(await createFolder(path, name));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "filerun-mcp";
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
