import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { convert, convertUrl, extractLinks } from "./api.js";
import { premiumRequired } from "./license.js";
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
            return textError(error(e));
        }
    });
    server.registerTool("convert_url", {
        title: "Convert url",
        description: "Fetch a page over http or https and convert it to markdown, so a web page can be read as clean text without a copy-paste step.",
        inputSchema: z.object({ url: z.string().describe("Page url, e.g. https://example.com/article."), max_length: z.number().describe("Max markdown characters.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: convert_url ----
        const paywallMessage = await premiumRequired("convert_url");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await convertUrl(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("extract_links", {
        title: "Extract links",
        description: "List every outbound link and image on a page, split into internal and external, resolved against the page url so relative hrefs become absolute.",
        inputSchema: z.object({ url: z.string().describe("Page url."), limit: z.number().describe("Max links per group.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: extract_links ----
        const paywallMessage = await premiumRequired("extract_links");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await extractLinks(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
