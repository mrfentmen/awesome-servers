import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { matches, testRegex } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "regex-mcp", version: "1.0.0" });
    server.registerTool("test", {
        title: "Test",
        description: "Test a regular expression against a string.",
        inputSchema: z.object({ pattern: z.string().describe("Regular expression."), input: z.string().describe("String to test.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await testRegex(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("matches", {
        title: "Matches",
        description: "Return all matches of a pattern in a string.",
        inputSchema: z.object({ pattern: z.string().describe("Regular expression."), input: z.string().describe("String to search."), limit: z.number().describe("Max matches.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await matches(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("replace_preview", {
        title: "Replace preview",
        description: "Apply a regular expression replacement to a text and show every match with its index and groups, plus the result, which is how you test a rewrite before running it.",
        inputSchema: z.object({ pattern: z.string().describe("Regular expression."), replacement: z.string().describe("Replacement text.").optional(), input: z.string().describe("Text to search.").optional(), flags: z.string().describe("Flags such as gi.").optional(), limit: z.number().describe("Max matches listed.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement preview locally (paywall removed)
        try {
            return textError("Not yet implemented: preview");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("extract_groups", {
        title: "Extract groups",
        description: "Turn a text into structured records by running a regular expression with capture groups, which is how a log becomes data.",
        inputSchema: z.object({ pattern: z.string().describe("Regular expression with capture groups."), input: z.string().describe("Text to search.").optional(), flags: z.string().describe("Flags such as g.").optional(), limit: z.number().describe("Max records.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement groups locally (paywall removed)
        try {
            return textError("Not yet implemented: groups");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "regex-mcp";
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
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
