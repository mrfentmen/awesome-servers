import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { template } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "gitignore-mcp", version: "1.0.0" });
    server.registerTool("template", {
        title: "Template",
        description: "Get a gitignore template.",
        inputSchema: z.object({ name: z.string().describe("Template name like node.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await template(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_templates", {
        title: "List templates",
        description: "Every gitignore template name Toptal publishes, so you can find the right one before fetching it.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement templates locally (paywall removed)
        try {
            return textError("Not yet implemented: templates");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("merged_template", {
        title: "Merged template",
        description: "Get one gitignore file merged from several templates at once, for example node,python,django, with the sections it includes.",
        inputSchema: z.object({ templates: z.string().describe("Template names joined by commas, e.g. 'node,python'."), max_lines: z.number().describe("Max lines to show, 10-400, default 120.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement template locally (paywall removed)
        try {
            return textError("Not yet implemented: template");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "gitignore-mcp";
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
