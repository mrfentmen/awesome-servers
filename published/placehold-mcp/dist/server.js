import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { image } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "placehold-mcp", version: "1.0.0" });
    server.registerTool("image", {
        title: "Image",
        description: "Placeholder image URL.",
        inputSchema: z.object({ width: z.number().describe("Width.").optional(), height: z.number().describe("Height.").optional(), text: z.string().describe("Optional label text.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await image(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("svg_source", {
        title: "SVG source",
        description: "Fetch the actual SVG markup placehold.co generates for a size, caption and colours, so it can be saved to a file or inlined into markup.",
        inputSchema: z.object({ width: z.number().describe("Width in pixels.").optional(), height: z.number().describe("Height in pixels, defaults to width.").optional(), text: z.string().describe("Caption to draw on the image.").optional(), background: z.string().describe("Background colour or hex.").optional(), foreground: z.string().describe("Text colour or hex.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement source locally (paywall removed)
        try {
            return textError("Not yet implemented: source");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "placehold-mcp";
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
    server.registerTool("status", {
        title: "Status",
        description: "Get server status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("Server is running normally.");
    });
    return server;
}
