import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseJsonc, stripJsonc, validateJsonc, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "jsonc-mcp", version: "1.0.0" });
    server.tool("parse_jsonc", "Parse JSON with // and /* */ comments (and optional trailing commas) into clean pretty JSON.", {
        text: z.string().min(2).describe("JSONC document text"),
        trailingCommas: z.boolean().default(true).describe("Also accept trailing commas in arrays and objects")
    }, async (a) => {
        try {
            return text(await parseJsonc(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("strip_jsonc", "Return the same document with comments and trailing commas removed, nothing else changed.", {
        text: z.string().min(2).describe("JSONC document text"),
        trailingCommas: z.boolean().default(true).describe("Also remove trailing commas")
    }, async (a) => {
        try {
            return text(await stripJsonc(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("validate_jsonc", "Check a JSONC document and, when it fails, point at the line with a caret.", {
        text: z.string().min(2).describe("JSONC document text")
    }, async (a) => {
        try {
            return text(await validateJsonc(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
