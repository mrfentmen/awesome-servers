import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getText, bookDigest } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "sefaria-mcp", version: "1.0.0" });
    server.registerTool("text", {
        title: "Text",
        description: "Get a text section.",
        inputSchema: z.object({ ref: z.string().describe("Ref like Genesis.1.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await getText(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("book_digest", {
        title: "Book digest",
        description: "What Sefaria's index says about a book: description, categories, corpus, dating, authorship and alternate titles.",
        inputSchema: z.object({ book: z.string().describe("Book name, e.g. Genesis, Shabbat, Mishnah Avot.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await bookDigest(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("book_structure", {
        title: "Book structure",
        description: "The shape of a book on Sefaria: section names, how many sections at each level, and the alternate groupings such as parashiyot or chapters with their ref ranges.",
        inputSchema: z.object({ book: z.string().describe("Book name, e.g. Genesis, Shabbat."), limit: z.number().describe("Max spans per alternate grouping, 1-30.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement structure locally (paywall removed)
        try {
            return textError("Not yet implemented: structure");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("topic_digest", {
        title: "Topic digest",
        description: "Sefaria's topic page for a slug: the description, how many passages link to it, its known names and its artwork credit.",
        inputSchema: z.object({ topic: z.string().describe("Topic slug, e.g. love, prayer, covenant.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement digest locally (paywall removed)
        try {
            return textError("Not yet implemented: digest");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "sefaria-mcp";
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
