import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createPdf } from "./api.js";
import { createReport, urlToPdf } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const WRITE = { readOnlyHint: false, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "pdf-generator-mcp", version: "1.0.0" });
    server.registerTool("create_pdf", {
        title: "Create pdf",
        description: "Create a PDF file with a title and body text.",
        inputSchema: z.object({ title: z.string().describe("Document title."), body: z.string().describe("Body text."), filename: z.string().describe("Output file name.").optional() }),
        annotations: WRITE,
    }, async (args) => {
        try {
            return text(await createPdf(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("create_report", {
        title: "Create report",
        description: "Create a simple report PDF with a title, author, and bullet lines.",
        inputSchema: z.object({ title: z.string().describe("Report title."), author: z.string().describe("Author name.").optional(), bullets: z.string().describe("Comma separated bullet lines.").optional() }),
        annotations: WRITE,
    }, async (args) => {
        try {
            return text(await createReport(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("url_to_pdf", {
        title: "Url to pdf",
        description: "Fetch a page over http or https, strip the markup down to its readable text and render it into a pdf file, which saves a print-to-pdf step.",
        inputSchema: z.object({ url: z.string().describe("Page url, e.g. https://example.com/article."), title: z.string().describe("Override the pdf title.").optional(), maxChars: z.number().describe("Max characters of text to render.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await urlToPdf(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "pdf-generator-mcp";
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
