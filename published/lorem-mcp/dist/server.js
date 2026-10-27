import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generate } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "lorem-mcp", version: "1.0.0" });
    server.registerTool("generate", {
        title: "Generate",
        description: "Generate lorem ipsum text.",
        inputSchema: z.object({ paragraphs: z.number().describe("Number of paragraphs.").optional(), words_per_paragraph: z.number().describe("Words per paragraph.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await generate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("html_text", {
        title: "Html text",
        description: "Lorem ipsum paragraphs wrapped in real html elements with an optional heading, which is what a layout mockup or component test needs.",
        inputSchema: z.object({ paragraphs: z.number().describe("How many paragraphs.").optional(), words_per_paragraph: z.number().describe("Words per paragraph.").optional(), heading: z.string().describe("Heading text.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement text locally (paywall removed)
        try {
            return textError("Not yet implemented: text");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("json_filler", {
        title: "Json filler",
        description: "Lorem ipsum records shaped like a real API response, with ids, timestamps, counts and booleans guessed from the field names, for wiring a frontend before the backend exists.",
        inputSchema: z.object({ count: z.number().describe("How many records.").optional(), fields: z.array(z.string()).describe("Field names, e.g. id, title, createdAt.").optional(), seedWord: z.string().describe("Recorded alongside the rows.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement filler locally (paywall removed)
        try {
            return textError("Not yet implemented: filler");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "lorem-mcp";
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
