import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { npmPackage, npmSearch, pypiPackage } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "package-registry-mcp", version: "1.0.0" });
    server.registerTool("npm_package", {
        title: "Npm package",
        description: "Look up an npm package by name.",
        inputSchema: z.object({ name: z.string().describe("Package name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await npmPackage(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("pypi_package", {
        title: "Pypi package",
        description: "Look up a PyPI package by name.",
        inputSchema: z.object({ name: z.string().describe("Package name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await pypiPackage(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("npm_search", {
        title: "Npm search",
        description: "Search npm packages by keyword.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await npmSearch(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("npm_dist_tags", {
        title: "npm dist-tags",
        description: "The dist-tags of an npm package, which is how you find the LTS or next line rather than whatever latest happens to be.",
        inputSchema: z.object({ package: z.string().describe("npm package, e.g. express."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement tags locally (paywall removed)
        try {
            return textError("Not yet implemented: tags");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("npm_publish_timeline", {
        title: "npm publish timeline",
        description: "An npm package's release history newest first with creation and last-modified dates, which shows how stale or how busy a package really is.",
        inputSchema: z.object({ package: z.string().describe("npm package, e.g. express."), limit: z.number().describe("Max versions.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement timeline locally (paywall removed)
        try {
            return textError("Not yet implemented: timeline");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "package-registry-mcp";
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
