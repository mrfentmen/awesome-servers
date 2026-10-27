import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { diffText } from "./api.js";
import { unifiedDiff, diffStats, structuredDiff, inlineDiff, applyPatchText } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "diff-mcp", version: "1.0.0" });
    server.registerTool("diff_text", {
        title: "Diff text",
        description: "Show the diff between two texts.",
        inputSchema: z.object({ a: z.string().describe("Original text."), b: z.string().describe("New text.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await diffText(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("unified_diff", {
        title: "Unified diff",
        description: "Show a unified diff between two texts.",
        inputSchema: z.object({ a: z.string().describe("Original text."), b: z.string().describe("New text."), context: z.number().describe("Context lines.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await unifiedDiff(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("diff_stats", {
        title: "Diff stats",
        description: "Measure a change instead of printing it: how many lines and characters were added and removed, how many stayed, the line delta, how many hunks the change splits into and their sizes, the share of the original left in place, and the longest single run of added or removed lines with the line it starts at. The diff_text tool caps its output at 200 lines and unified_diff at 8000 characters, so on a large change they show a prefix rather than the shape.",
        inputSchema: z.object({ a: z.string().describe("Original text."), b: z.string().describe("New text.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await diffStats(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("structured_diff", {
        title: "Structured diff",
        description: "Compare two JSON or YAML documents key by key rather than line by line: which keys were added, removed or changed and at what path, including inside nested objects and arrays, with a fallback to a word level diff when neither side is a structured document. A reformatting shows as no change at all here, where a line diff shows a wholesale rewrite.",
        inputSchema: z.object({ a: z.string().describe("Original JSON or YAML document."), b: z.string().describe("Changed JSON or YAML document.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await structuredDiff(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("inline_diff", {
        title: "Inline diff",
        description: "Word-level diff of two texts: the changed words marked inside the line with - removed and + added, with elisions instead of the silent truncation diff_text and unified_diff apply, plus a tally of words added, removed and unchanged.",
        inputSchema: z.object({ a: z.string().describe("Original text."), b: z.string().describe("New text."), context: z.number().int().describe("Unchanged words kept either side of each change.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await inlineDiff(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("apply_patch", {
        title: "Apply patch",
        description: "Apply a unified diff to a source text and report which hunks applied and which did not. The other tools all read a pair of texts; this one turns a patch back into text.",
        inputSchema: z.object({ source: z.string().describe("The text the patch was made against."), patch: z.string().describe("A unified diff.").default("") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await applyPatchText(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "diff-mcp";
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
