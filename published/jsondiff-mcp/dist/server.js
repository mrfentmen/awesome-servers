import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { applyJsonPatch, canonicalJson, diffJson, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "jsondiff-mcp", version: "1.0.0" });
    server.tool("diff_json", "Structural diff between two JSON documents: added, removed and changed paths.", {
        left: z.string().describe('First JSON document as text'), right: z.string().describe('Second JSON document as text')
    }, async (a) => {
        try {
            return text(await diffJson(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("apply_json_patch", "Apply an RFC 6902 JSON Patch (add, remove, replace, move, copy, test) to a document.", {
        target: z.string().describe('JSON document as text'), patch: z.string().describe('JSON array of patch operations')
    }, async (a) => {
        try {
            return text(await applyJsonPatch(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("canonical_json", "Re-serialise JSON deterministically, sorting keys so equal values compare byte-for-byte.", {
        text: z.string().describe('JSON text'), sortKeys: z.boolean().optional().describe('Sort object keys, default true'), indent: z.number().int().min(0).max(8).optional().describe('Indent, 0 for compact, default 2')
    }, async (a) => {
        try {
            return text(await canonicalJson(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
