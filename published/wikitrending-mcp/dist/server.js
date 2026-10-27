import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { featured, mostread, projectPageviews } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "wikitrending-mcp", version: "1.0.0" });
    server.registerTool("featured", {
        title: "Featured",
        description: "Featured article for a date.",
        inputSchema: z.object({ date: z.string().describe("Date YYYY/MM/DD, defaults to today.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await featured(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("mostread", {
        title: "Mostread",
        description: "Most-read articles for a date.",
        inputSchema: z.object({ date: z.string().describe("Date YYYY/MM/DD, defaults to today.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await mostread(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("on_this_day", {
        title: "On this day",
        description: "Notable things that happened on a date, from the same Wikipedia featured feed as featured and mostread.",
        inputSchema: z.object({ date: z.string().describe("Date as YYYY/MM/DD or YYYY-MM-DD; defaults to today.").optional(), limit: z.number().int().min(1).max(25).default(10).describe("Max entries.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement day locally (paywall removed)
        try {
            return textError("Not yet implemented: day");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("picture_of_the_day", {
        title: "Picture of the day",
        description: "Wikipedia's picture of the day for a date, with its description, artist, licence and image link.",
        inputSchema: z.object({ date: z.string().describe("Date as YYYY/MM/DD or YYYY-MM-DD; defaults to today.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement day locally (paywall removed)
        try {
            return textError("Not yet implemented: day");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("article_pageviews", {
        title: "Article pageviews",
        description: "Daily readership of an English Wikipedia article over a date range.",
        inputSchema: z.object({ title: z.string().describe("Exact article title."), start: z.string().describe("First date, YYYY-MM-DD."), end: z.string().describe("Last date, YYYY-MM-DD; at most 31 days inclusive.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement pageviews locally (paywall removed)
        try {
            return textError("Not yet implemented: pageviews");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("project_pageviews", {
        title: "Project pageviews",
        description: "Daily total readership of English Wikipedia over a date range.",
        inputSchema: z.object({ start: z.string().describe("First date, YYYY-MM-DD."), end: z.string().describe("Last date, YYYY-MM-DD; at most 31 days inclusive.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await projectPageviews(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "wikitrending-mcp";
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
    return server;
}
