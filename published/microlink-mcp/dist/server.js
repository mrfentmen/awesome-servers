import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { preview, pageMetadata } from "./api.js";
import { premiumTool } from "./gateway.js";
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
            return textError(error(e));
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
            return textError(error(e));
        }
    });
    server.registerTool("page_screenshot", {
        title: "Page screenshot",
        description: "Render a page to an image with Microlink and return the image url, format and pixel dimensions.",
        inputSchema: z.object({ url: z.string().describe("Page URL."), width: z.number().int().min(320).max(1920).default(1280).describe("Viewport width in pixels."), mobile: z.boolean().default(false).describe("Emulate a mobile device") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: page_screenshot ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_microlink_page_screenshot", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
