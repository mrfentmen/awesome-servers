import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_latest, m0_versions } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'go-proxy-mcp', version: '1.0.0' });
    server.registerTool("latest", {
        title: "Latest",
        description: "Latest version of a Go module.",
        inputSchema: z.object({ module: z.string().describe("Module path like github.com/gin-gonic/gin.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_latest(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("versions", {
        title: "Versions",
        description: "Available versions of a Go module.",
        inputSchema: z.object({ module: z.string().describe("Module path."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_versions(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "The Go module proxy's record for one specific version: publication time, VCS, source repository, ref and commit hash.",
        inputSchema: z.object({ module: z.string().describe("Module path like github.com/gin-gonic/gin."), version: z.string().describe("Version like v1.9.1.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement info locally (paywall removed)
        try {
            return textError("Not yet implemented: info");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("module_manifest", {
        title: "Module manifest",
        description: "The go.mod a Go module version declares: its Go version requirement and every direct and indirect dependency it pins.",
        inputSchema: z.object({ module: z.string().describe("Module path like github.com/gin-gonic/gin."), version: z.string().describe("Version like v1.9.1.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement manifest locally (paywall removed)
        try {
            return textError("Not yet implemented: manifest");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "go-proxy-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
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
