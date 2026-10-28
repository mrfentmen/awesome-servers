import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { diffStats, unifiedDiff, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "text-diff-mcp", version: "1.0.0" });
    server.tool("unified_diff", "Build a unified diff (patch format) between two texts.", {
        before: z.string().describe("Original text"),
        after: z.string().describe("New text"),
        context: z.number().int().min(0).max(10).default(3).describe("Context lines around each change"),
        labelBefore: z.string().default("before").describe("Label for the original file in the header"),
        labelAfter: z.string().default("after").describe("Label for the new file in the header")
    }, async (a) => {
        try {
            return text(await unifiedDiff(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("diff_stats", "Count added, removed and unchanged lines between two texts.", {
        before: z.string().describe("Original text"),
        after: z.string().describe("New text")
    }, async (a) => {
        try {
            return text(await diffStats(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
