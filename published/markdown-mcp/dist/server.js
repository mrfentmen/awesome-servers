import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { headings, toHtml, emojiShortcodes } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "markdown-mcp", version: "1.0.0" });
    server.registerTool("to_html", {
        title: "To html",
        description: "Convert markdown to HTML.",
        inputSchema: z.object({ markdown: z.string().describe("Markdown text.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await toHtml(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("headings", {
        title: "Headings",
        description: "Extract the heading outline from markdown.",
        inputSchema: z.object({ markdown: z.string().describe("Markdown text.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await headings(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("table_to_markdown", {
        title: "Table to markdown",
        description: "Build a markdown pipe table from headers and rows, with optional per-column alignment and automatic pipe escaping, which is the one markdown shape you always have to hand write.",
        inputSchema: z.object({ headers: z.array(z.string()).describe("Column headers."), rows: z.array(z.array(z.string())).describe("Rows of cells."), align: z.array(z.string()).describe("left, center, right per column.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: table_to_markdown ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_markdown_table_to_markdown", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("check_document", {
        title: "Check document",
        description: "Lint a markdown document for heading jumps, unclosed code fences and missing top level heading, which the heading and html tools never check for.",
        inputSchema: z.object({ markdown: z.string().describe("The markdown document."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: check_document ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_markdown_check_document", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("repository_readme", {
        title: "Repository README",
        description: "Retrieve the current Markdown README of a public GitHub repository, with its source URL.",
        inputSchema: z.object({ owner: z.string().describe("GitHub owner."), repo: z.string().describe("Repository name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await premiumTool("mcp_markdown_repository_readme", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("emoji_shortcodes", {
        title: "Emoji shortcodes",
        description: "Find supported GitHub Markdown emoji shortcodes and image URLs from GitHub's live emoji catalog.",
        inputSchema: z.object({ query: z.string().optional(), limit: z.number().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await emojiShortcodes(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
