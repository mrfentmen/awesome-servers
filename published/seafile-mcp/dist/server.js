import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listLibraries, getLibraryInfo, getDefaultLibrary, getFileDetail, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "seafile-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_libraries", {
        title: "List libraries",
        description: "All libraries the token can access.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listLibraries());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_library_info", {
        title: "Library info",
        description: "Seafile library metadata.",
        inputSchema: z.object({
            repo_id: z.string().describe("Library (repo) ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ repo_id }) => {
        try {
            return text(await getLibraryInfo(repo_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_default_library", {
        title: "Default library",
        description: "The account default library.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getDefaultLibrary());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_file_detail", {
        title: "File detail",
        description: "Metadata of a file in a library.",
        inputSchema: z.object({
            repo_id: z.string().describe("Library (repo) ID."),
            path: z.string().describe("File path, e.g. /docs/report.pdf.")
        }),
        annotations: READ_ONLY,
    }, async ({ repo_id, path }) => {
        try {
            return text(await getFileDetail(repo_id, path));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "seafile-mcp";
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
