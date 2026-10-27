import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { search, byOwner, apiVersions } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: 'swaggerhub-mcp', version: '1.0.0' });
    server.registerTool('search', {
        title: "Search",
        description: 'Search the SwaggerHub registry.',
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
    server.registerTool('byOwner', {
        title: "By Owner",
        description: 'List APIs by owner.',
        inputSchema: z.object({ owner: z.string().describe('Owner user or org.').optional(), limit: z.number().describe('Max results.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await byOwner(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("sort_registry", {
        title: "Browse the registry",
        description: "Browse the whole SwaggerHub registry by sort order and page offset - newest, oldest, alphabetical or by owner - instead of by text search.",
        inputSchema: z.object({ sort: z.string().describe("NAME, UPDATED, CREATED, OWNER, BEST_MATCH or TITLE.").optional(), offset: z.number().describe("Entries to skip.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement registry locally (paywall removed)
        try {
            return textError("Not yet implemented: registry");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("api_versions", {
        title: "API versions",
        description: "Every version SwaggerHub holds for one API, with dates, OAS level and the default version.",
        inputSchema: z.object({ owner: z.string().describe("Owner user or org, e.g. smartbear."), api: z.string().describe("API name, e.g. 0-0-0.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await apiVersions(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("spec_summary", {
        title: "Spec summary",
        description: "Fetch an OpenAPI spec from its SwaggerHub URL and report its title, spec version, servers, endpoint count and paths.",
        inputSchema: z.object({ spec_url: z.string().describe("Spec URL as listed in search results."), limit: z.number().describe("Max paths.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement summary locally (paywall removed)
        try {
            return textError("Not yet implemented: summary");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "swaggerhub-mcp";
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
