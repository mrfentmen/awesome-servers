import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { search, byName, apiDirectoryStats } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: 'apis-guru-mcp', version: '1.0.0' });
    server.registerTool('search', {
        title: "Search",
        description: 'Search the APIs.guru directory.',
        inputSchema: z.object({ query: z.string().describe('Search terms.').optional(), limit: z.number().describe('Max results.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('byName', {
        title: "By Name",
        description: 'Get one API by directory name.',
        inputSchema: z.object({ name: z.string().describe('Name like openai.com.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await byName(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("api_endpoints", {
        title: "API endpoints",
        description: "List the operations in a published OpenAPI spec for an APIs.guru directory entry, with HTTP method, path, summary and operation id.",
        inputSchema: z.object({ name: z.string().describe("Directory key, e.g. google.com or stripe.com[2022-11-15]."), version: z.string().describe("Spec version, e.g. v3.").optional(), search: z.string().describe("Filter paths and summaries.").optional(), limit: z.number().describe("Max operations.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement endpoints locally (paywall removed)
        try {
            return textError("Not yet implemented: endpoints");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("api_versions", {
        title: "API versions",
        description: "Every published spec version for an APIs.guru entry with its OpenAPI version, added and updated dates, and optionally the number of paths in each spec.",
        inputSchema: z.object({ name: z.string().describe("Directory key, e.g. google.com."), endpoint_counts: z.boolean().describe("Count paths in each spec, which fetches every spec.").optional() }),
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
    server.registerTool("api_directory_stats", {
        title: "Directory stats",
        description: "Aggregate the APIs.guru directory by provider, by number of published versions, or by most recently added entry.",
        inputSchema: z.object({ group_by: z.string().describe("provider, version_count or recent.").optional(), limit: z.number().describe("Max rows.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await apiDirectoryStats(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    const serverName = "apis-guru-mcp";
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
