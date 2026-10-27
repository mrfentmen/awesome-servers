import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseImageUrl, parseImagePost, ocrCleanup, documentFields, ocrConfusionAudit } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "ocrspace-mcp",
        version: "1.0.0",
    });
    server.registerTool("parse_image_url", {
        title: "OCR via GET",
        description: "Extract text from an image URL.",
        inputSchema: z.object({
            image_url: z.string().describe("Public image URL."),
            language: z.string().describe("e.g. eng (default eng).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ image_url, language }) => {
        try {
            return text(await parseImageUrl(image_url, language));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("parse_image_post", {
        title: "OCR via POST",
        description: "Extract text with overlay option.",
        inputSchema: z.object({
            image_url: z.string().describe("Public image URL."),
            overlay: z.string().describe("true/false (default false).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ image_url, overlay }) => {
        try {
            return text(await parseImagePost(image_url, overlay));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ocr_cleanup", {
        title: "OCR text cleanup",
        description: "Clean up raw OCR output: de-hyphenate words split across line breaks, rejoin wrapped lines into their paragraphs, drop bare page numbers, normalise spaces, quotes and dashes, and fix spacing around punctuation. Reports what it changed.",
        inputSchema: z.object({
            input: z.string().describe("The raw text an OCR tool returned, up to 20000 characters."),
            keep_blank_lines: z.boolean().describe("Keep a blank line between paragraphs (default false).").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ocrCleanup(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("document_fields", {
        title: "Document field extraction",
        description: "Pull the fields out of OCR text: emails, URLs, phone numbers, IBANs, dates, percentages, currency amounts, VAT/GST numbers, invoice and product codes, each with the line it came from.",
        inputSchema: z.object({
            input: z.string().describe("The OCR text of a document, up to 20000 characters."),
            only: z.string().describe("Only report field types containing this text, e.g. 'date' or 'vat'.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await documentFields(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ocr_confusion_audit", {
        title: "OCR confusion audit",
        description: "Flag the lines where OCR character recognition most likely failed: rn read as m, cl as d, vv as w, O and 0, l I 1, S and 5, B and 8, digits mixed into words, and words recognised twice.",
        inputSchema: z.object({
            input: z.string().describe("The OCR text to audit, up to 20000 characters."),
            limit: z.number().describe("How many flagged lines to show, 1-40.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ocrConfusionAudit(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ocrspace-mcp";
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
    return server;
}
