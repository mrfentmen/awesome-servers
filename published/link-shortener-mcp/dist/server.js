import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { expand, shorten, pageExtract, redirectChain } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "link-shortener-mcp", version: "1.0.0" });
    server.registerTool("shorten", {
        title: "Shorten",
        description: "Shorten a URL.",
        inputSchema: z.object({ url: z.string().describe("The URL to shorten.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await shorten(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("expand", {
        title: "Expand",
        description: "Expand a short URL.",
        inputSchema: z.object({ url: z.string().describe("The short URL.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await expand(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("link_preview", {
        title: "Link preview",
        description: "Title, description, publisher and social image for any URL, read live via the microlink API.",
        inputSchema: z.object({ url: z.string().describe("The URL to preview.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement preview locally (paywall removed)
        try {
            return textError("Not yet implemented: preview");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("link_screenshot", {
        title: "Link screenshot",
        description: "Hosted PNG screenshot of any web page, returned as an image URL from the microlink API.",
        inputSchema: z.object({ url: z.string().describe("The URL to capture."), width: z.number().describe("Viewport width in pixels.").optional(), height: z.number().describe("Viewport height in pixels.").optional() }),
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
    server.registerTool("page_extract", {
        title: "Extract from page",
        description: "Text or attribute values of one CSS selector on a page (h1 headings, link hrefs, prices) via the microlink API.",
        inputSchema: z.object({ url: z.string().describe("The page to read."), selector: z.string().describe("CSS selector, e.g. h1 or meta[name=description]."), attribute: z.string().describe("HTML attribute to read instead of text, e.g. href or src.").optional(), all: z.boolean().describe("Return every match, not just the first.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await pageExtract(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("redirect_chain", {
        title: "Redirect chain",
        description: "Every redirect hop of a URL with its status code, ending at the final destination.",
        inputSchema: z.object({ url: z.string().describe("The URL to trace."), maxHops: z.number().describe("Stop after this many hops.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await redirectChain(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "link-shortener-mcp";
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
