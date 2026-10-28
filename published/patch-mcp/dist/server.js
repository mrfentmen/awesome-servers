import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { applyPatch, checkPatch, makePatch, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "patch-mcp", version: "1.0.0" });
    server.tool("make_patch", "Produce a unified diff between two texts with configurable context lines.", {
        before: z.string().describe('Original text'), after: z.string().describe('Changed text'), context: z.number().int().min(0).max(20).optional().describe('Context lines per hunk, default 3'), oldPath: z.string().optional().describe('Label for the old file, default a'), newPath: z.string().optional().describe('Label for the new file, default b')
    }, async (a) => {
        try {
            return text(await makePatch(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("apply_patch", "Apply a unified diff to text; fails with a precise message when a hunk does not match.", {
        text: z.string().describe('Text to patch'), patch: z.string().describe('Unified diff'), reverse: z.boolean().optional().describe('Apply the patch in reverse, undoing it')
    }, async (a) => {
        try {
            return text(await applyPatch(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("check_patch", "Dry-run a unified diff against text and report whether it applies cleanly.", {
        text: z.string().describe('Text to test against'), patch: z.string().describe('Unified diff')
    }, async (a) => {
        try {
            return text(await checkPatch(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
