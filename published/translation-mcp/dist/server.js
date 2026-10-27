import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { detectAndTranslate, translate } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "translation-mcp", version: "1.0.0" });
    server.registerTool("translate", {
        title: "Translate",
        description: "Translate text from a source to a target language.",
        inputSchema: z.object({ text: z.string().describe("Text to translate."), from: z.string().describe("Source language code.").optional(), to: z.string().describe("Target language code.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await translate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("detect_and_translate", {
        title: "Detect and translate",
        description: "Translate text with automatic language detection.",
        inputSchema: z.object({ text: z.string().describe("Text to translate."), to: z.string().describe("Target language code.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await detectAndTranslate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("translate_batch", {
        title: "Translate batch",
        description: "Translate several strings at once through MyMemory, with a match score per line, which is how you get a whole page through the free tier without a request per line.",
        inputSchema: z.object({ texts: z.array(z.string()).describe("Up to 10 strings to translate."), from: z.string().describe("Source language code, default en.").optional(), to: z.string().describe("Target language code, e.g. fr."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement batch locally (paywall removed)
        try {
            return textError("Not yet implemented: batch");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "translation-mcp";
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
