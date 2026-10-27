import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { analyzeText, compareLookalikes, skeleton } from "./security.js";
import { characterDecomposition, codePointInfo } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorMessage = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "unicode-security-mcp", version: "1.0.0" });
    server.registerTool("analyze_text", {
        title: "Analyze text",
        description: "Analyze text locally for Unicode confusables, mixed scripts, invisible controls, and a heuristic risk score. Input is never sent anywhere.",
        inputSchema: z.object({ text: z.string().max(10000) }),
        annotations: READ_ONLY,
    }, async ({ text: value }) => text(JSON.stringify(analyzeText(value), null, 2)));
    server.registerTool("compare_identifiers", {
        title: "Compare identifiers",
        description: "Compare two identifiers using a Unicode-aware confusable skeleton. This is a warning aid, not a complete security proof.",
        inputSchema: z.object({ left: z.string().min(1).max(500), right: z.string().min(1).max(500) }),
        annotations: READ_ONLY,
    }, async ({ left, right }) => text(JSON.stringify(compareLookalikes(left, right), null, 2)));
    server.registerTool("get_skeleton", {
        title: "Get skeleton",
        description: "Return a local normalized confusable skeleton for one identifier.",
        inputSchema: z.object({ value: z.string().max(500) }),
        annotations: READ_ONLY,
    }, async ({ value }) => text(skeleton(value)));
    server.registerTool("code_point_info", {
        title: "Code point info",
        description: "The Unicode Character Database's own record for one code point: official name, general category, combining class, bidi class, and its TR39 skeleton. Only the code point is sent; the tables are fetched once and cached.",
        inputSchema: z.object({ codePoint: z.string().min(1).max(16).describe("A code point, e.g. '0430', 'U+0430', '0x202E', or the character itself.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await codePointInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("confusable_family", {
        title: "Confusable family",
        description: "Every character Unicode's TR39 confusables table maps to the same skeleton as this one — the full confusable set, not the server's short local list. Only the code point is sent.",
        inputSchema: z.object({ character: z.string().min(1).max(16).describe("A character or code point, e.g. '0430' or 'U+0430'."), limit: z.number().int().describe("Max confusables to list.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement family locally (paywall removed)
        try {
            return textError("Not yet implemented: family");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("character_decomposition", {
        title: "Character decomposition",
        description: "The canonical or compatibility decomposition Unicode records for a code point, each step named, and whether normalization can put it back together. Only the code point is sent.",
        inputSchema: z.object({ codePoint: z.string().min(1).max(16).describe("A code point, e.g. 'FB01' or 'U+FB01'.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await characterDecomposition(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "unicode-security-mcp";
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
