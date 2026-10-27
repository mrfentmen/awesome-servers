import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatSurvey, FormbricksError, listSurveys, surveyResponses } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "formbricks-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_surveys", {
        title: "List surveys",
        description: "Formbricks surveys with statuses and response counts.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(100).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            const rows = await listSurveys(limit);
            if (rows.length === 0)
                return text("No surveys.");
            return text(rows.map((s, i) => formatSurvey(s, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("survey_responses", {
        title: "Survey responses",
        description: "Latest responses of one survey.",
        inputSchema: z.object({
            id: z.string().describe("Survey id (use list_surveys)"),
            limit: z.number().int().min(1).max(100).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ id, limit }) => {
        try {
            const rows = await surveyResponses(id, limit);
            if (rows.length === 0)
                return text(`No responses for survey ${id}.`);
            return text(rows.join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "formbricks-mcp";
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
    server.registerTool("status", {
        title: "Status",
        description: "Get server status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("Server is running normally.");
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof FormbricksError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
