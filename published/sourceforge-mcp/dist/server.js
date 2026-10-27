import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatProject, getProject, SourceForgeError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "sourceforge-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_project", {
        title: "Get project",
        description: "A SourceForge project: name, description, link.",
        inputSchema: z.object({
            shortname: z.string().describe("Project shortname, e.g. 'filezilla'"),
        }),
        annotations: READ_ONLY,
    }, async ({ shortname }) => {
        try {
            return text(formatProject(await getProject(shortname)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_project_news", {
        title: "List project news",
        description: "Recent news and release announcement posts from a SourceForge project's Allura news feed.",
        inputSchema: z.object({
            shortname: z.string().describe("Project shortname, e.g. 'filezilla'"),
            limit: z.number().describe("Max posts, 1-50, default 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            // TODO: implement news locally (paywall removed)
            try {
                return textError("Not yet implemented: news");
            }
            catch (e) {
                return textError(String(e));
            }
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_project_activity", {
        title: "List project activity",
        description: "Recent activity feed for a SourceForge project: who did what, when, and a link to the item.",
        inputSchema: z.object({
            shortname: z.string().describe("Project shortname, e.g. 'filezilla'"),
            limit: z.number().describe("Max events, 1-50, default 12.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            // TODO: implement activity locally (paywall removed)
            try {
                return textError("Not yet implemented: activity");
            }
            catch (e) {
                return textError(String(e));
            }
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "sourceforge-mcp";
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
function errorMessage(e) {
    if (e instanceof SourceForgeError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
