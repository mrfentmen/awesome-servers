import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { info } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "unpkg-mcp", version: "1.0.0" });
    server.registerTool("info", {
        title: "Info",
        description: "Metadata for an npm package from unpkg.",
        inputSchema: z.object({ name: z.string().describe("Package name."), version: z.string().describe("Version.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await info(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("files", {
        title: "Files",
        description: "List the files unpkg serves for a package version, with size, MIME type and path, for a directory or the package root.",
        inputSchema: z.object({ name: z.string().describe("Package name, e.g. lodash."), version: z.string().describe("Exact version, e.g. 4.17.21.").optional(), path: z.string().describe("Directory inside the package, e.g. / or dist/.").optional(), limit: z.number().int().min(1).max(200).default(20).describe("Max files.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement files locally (paywall removed)
        try {
            return textError("Not yet implemented: files");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("read_file", {
        title: "Read file",
        description: "Read the first part of a file as published on unpkg, for a package version.",
        inputSchema: z.object({ name: z.string().describe("Package name, e.g. lodash."), path: z.string().describe("File path inside the package, e.g. package.json."), version: z.string().describe("Exact version, e.g. 4.17.21.").optional(), max_bytes: z.number().int().min(200).max(20000).default(2000).describe("Characters to return.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement file locally (paywall removed)
        try {
            return textError("Not yet implemented: file");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "unpkg-mcp";
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
