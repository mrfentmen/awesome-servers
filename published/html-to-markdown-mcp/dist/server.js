import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { convert, convertUrl, extractLinks } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "html-to-markdown-mcp", version: "1.0.0" });
    server.registerTool("convert", {
        title: "Convert",
        description: "Convert HTML to markdown.",
        inputSchema: z.object({ html: z.string().describe("HTML text."), max_length: z.number().describe("Max output length.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await convert(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("convert_url", {
        title: "Convert url",
        description: "Fetch a page over http or https and convert it to markdown, so a web page can be read as clean text without a copy-paste step.",
        inputSchema: z.object({ url: z.string().describe("Page url, e.g. https://example.com/article."), max_length: z.number().describe("Max markdown characters.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await convertUrl(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("extract_links", {
        title: "Extract links",
        description: "List every outbound link and image on a page, split into internal and external, resolved against the page url so relative hrefs become absolute.",
        inputSchema: z.object({ url: z.string().describe("Page url."), limit: z.number().describe("Max links per group.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await extractLinks(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "html-to-markdown-mcp";
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
