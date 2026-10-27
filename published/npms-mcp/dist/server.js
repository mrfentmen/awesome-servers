import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatScored, getPackage, NpmsError, searchPackages } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "npms-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_packages", {
        title: "Search scored packages",
        description: "Search npm packages with quality, popularity and maintenance scores. Use before adding a dependency.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'markdown parser'"),
            limit: z.number().int().min(1).max(25).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const results = await searchPackages(query, limit);
            if (results.length === 0)
                return text(`No packages match "${query}".`);
            return text(`Scored packages for "${query}":\n\n${results.map((p, i) => formatScored(p, i)).join("\n\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_package", {
        title: "Get package score",
        description: "Quality, popularity and maintenance scores for one npm package.",
        inputSchema: z.object({
            name: z.string().describe("Package name, e.g. 'express'"),
        }),
        annotations: READ_ONLY,
    }, async ({ name }) => {
        try {
            return text(formatScored(await getPackage(name)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("package_downloads", {
        title: "Package downloads",
        description: "The download windows npms.io tracked for an npm package: last day, week, month, quarter, half year and year.",
        inputSchema: z.object({ name: z.string().describe("Package name, e.g. 'express'.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement downloads locally (paywall removed)
        try {
            return textError("Not yet implemented: downloads");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("package_health", {
        title: "Package health",
        description: "Maintenance signals for an npm package: GitHub stars and forks, open issue count and arrival rate, test coverage, linters and outdated dependencies.",
        inputSchema: z.object({ name: z.string().describe("Package name, e.g. 'express'.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement health locally (paywall removed)
        try {
            return textError("Not yet implemented: health");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "npms-mcp";
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
function errorMessage(e) {
    if (e instanceof NpmsError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
