import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { preview, pageMetadata } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "microlink-mcp", version: "1.0.0" });
    server.registerTool("preview", {
        title: "Preview",
        description: "Get a link preview.",
        inputSchema: z.object({ url: z.string().describe("Target URL.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await preview(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("page_metadata", {
        title: "Page metadata",
        description: "Read a page's title, description, language, author, publisher, date, share image and logo through Microlink.",
        inputSchema: z.object({ url: z.string().describe("Page URL, e.g. 'https://example.com'.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await pageMetadata(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("page_screenshot", {
        title: "Page screenshot",
        description: "Render a page to an image with Microlink and return the image url, format and pixel dimensions.",
        inputSchema: z.object({ url: z.string().describe("Page URL."), width: z.number().int().min(320).max(1920).default(1280).describe("Viewport width in pixels."), mobile: z.boolean().default(false).describe("Emulate a mobile device") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement screenshot locally (paywall removed)
        try {
            return textError("Not yet implemented: screenshot");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "microlink-mcp";
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
