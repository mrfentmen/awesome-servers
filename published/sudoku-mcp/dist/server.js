import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generate, solve } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "sudoku-mcp", version: "1.0.0" });
    server.registerTool("generate", {
        title: "Generate",
        description: "Generate a Sudoku puzzle with a difficulty.",
        inputSchema: z.object({ difficulty: z.string().describe("easy, medium, hard, or expert.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await generate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("solve", {
        title: "Solve",
        description: "Solve a Sudoku puzzle.",
        inputSchema: z.object({ grid: z.string().describe("81 digits, 0 for empty cells.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await solve(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("hint", {
        title: "Hint",
        description: "Solve a Sudoku and return just the value for the first empty cell, one nudge at a time.",
        inputSchema: z.object({ grid: z.string().describe("81 digits, 0 or . for empty cells.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement hint locally (paywall removed)
        try {
            return textError("Not yet implemented: hint");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("validate", {
        title: "Validate",
        description: "Check a partial Sudoku for duplicate digits in rows, columns and boxes, and say whether it has a unique solution.",
        inputSchema: z.object({ grid: z.string().describe("81 digits, 0 or . for empty cells.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement validate locally (paywall removed)
        try {
            return textError("Not yet implemented: validate");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "sudoku-mcp";
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
