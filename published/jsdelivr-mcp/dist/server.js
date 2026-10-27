import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { packageInfo, stats } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "jsdelivr-mcp", version: "1.0.0" });
    server.registerTool("package", {
        title: "Package",
        description: "Versions for an npm package.",
        inputSchema: z.object({ name: z.string().describe("Package name like lodash.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await packageInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("stats", {
        title: "Stats",
        description: "CDN usage statistics for an npm package.",
        inputSchema: z.object({ name: z.string().describe("Package name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await stats(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("resolve_version", {
        title: "Resolve version",
        description: "Resolve a semver range or dist-tag for an npm package to the exact version jsDelivr would serve, so a build can be pinned.",
        inputSchema: z.object({ package: z.string().describe("npm package, e.g. express."), range: z.string().describe("Semver range or dist-tag.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement version locally (paywall removed)
        try {
            return textError("Not yet implemented: version");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("version_detail", {
        title: "Version detail",
        description: "The published file tree of one exact version of an npm package, its top-level layout and its CDN url.",
        inputSchema: z.object({ package: z.string().describe("npm package, e.g. express."), version: z.string().describe("Exact version such as 4.22.3."), }),
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
    server.registerTool("version_list", {
        title: "Version list",
        description: "Every published version of an npm package, newest first, with its dist-tags and any deprecation notices.",
        inputSchema: z.object({ package: z.string().describe("npm package, e.g. express."), limit: z.number().describe("Max versions.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement list locally (paywall removed)
        try {
            return textError("Not yet implemented: list");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "jsdelivr-mcp";
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
