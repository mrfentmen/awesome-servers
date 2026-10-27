import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, minify, analyse } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "sql-formatter-mcp", version: "1.0.0" });
    server.registerTool("format", {
        title: "Format",
        description: "Format a SQL query.",
        inputSchema: z.object({ sql: z.string().describe("The SQL query."), dialect: z.string().describe("sql, postgresql, mysql, or sqlite.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await format(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("minify", {
        title: "Minify",
        description: "Collapse a SQL query to a single line with normalised spacing, for logs, diffs and size checks.",
        inputSchema: z.object({ sql: z.string().describe("SQL query to minify."), dialect: z.string().describe("sql, postgresql, mysql, sqlite, mariadb or tsql.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await minify(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("analyse", {
        title: "Analyse a query",
        description: "Break a SQL query down: statement types, tables touched, joins, CTEs, subqueries, aggregates and function calls.",
        inputSchema: z.object({ sql: z.string().describe("SQL query to analyse."), dialect: z.string().describe("sql, postgresql, mysql, sqlite, mariadb or tsql.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await analyse(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "sql-formatter-mcp";
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
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    return server;
}
