import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatStory, formatStoryDetail, getSpace, getStory, listStories, StoryblokError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "storyblok-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_space", {
        title: "Get space",
        description: "Storyblok space info: name, domain, plan.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(await getSpace());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_stories", {
        title: "List stories",
        description: "Stories with slugs and publish dates, optionally under a folder.",
        inputSchema: z.object({
            starts_with: z.string().default("").describe("Folder slug, e.g. 'blog', empty = all"),
            limit: z.number().int().min(1).max(100).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ starts_with, limit }) => {
        try {
            const rows = await listStories(starts_with, limit);
            if (rows.length === 0)
                return text("No stories.");
            return text(rows.map((s, i) => formatStory(s, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_story", {
        title: "Get story",
        description: "One story: name, date, content keys.",
        inputSchema: z.object({
            slug: z.string().describe("Full slug, e.g. 'blog/hello'"),
        }),
        annotations: READ_ONLY,
    }, async ({ slug }) => {
        try {
            return text(formatStoryDetail(await getStory(slug)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "storyblok-mcp";
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
function errorMessage(e) {
    if (e instanceof StoryblokError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
