import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { browseHot, browseNewest, searchTags, getDeviation, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "deviantart-mcp",
        version: "1.0.0",
    });
    server.registerTool("browse_hot", {
        title: "Browse hot art",
        description: "Currently hot DeviantArt deviations with authors and stats.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await browseHot());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("browse_newest", {
        title: "Browse newest",
        description: "Newest DeviantArt deviations across the site.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await browseNewest());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_tags", {
        title: "Search by tag",
        description: "DeviantArt deviations tagged with a word.",
        inputSchema: z.object({
            tag: z.string().describe("Tag, e.g. 'dragon'"),
        }),
        annotations: READ_ONLY,
    }, async ({ tag }) => {
        try {
            return text(await searchTags(tag));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_deviation", {
        title: "Get deviation metadata",
        description: "Metadata for DeviantArt deviations by id.",
        inputSchema: z.object({
            deviationIds: z.string().describe("Comma-separated deviation ids"),
        }),
        annotations: READ_ONLY,
    }, async ({ deviationIds }) => {
        try {
            return text(await getDeviation(deviationIds));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "deviantart-mcp";
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
