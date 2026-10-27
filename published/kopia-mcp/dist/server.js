import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listSources, listSnapshots, getRepoStatus, getCurrentUser, getTasksSummary, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "kopia-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_sources", {
        title: "List sources",
        description: "Snapshot sources on the Kopia server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listSources());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_snapshots", {
        title: "List snapshots",
        description: "Snapshots on the Kopia server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listSnapshots());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_repo_status", {
        title: "Repo status",
        description: "Repository connection status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getRepoStatus());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_current_user", {
        title: "Current user",
        description: "Authenticated Kopia server user.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getCurrentUser());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_tasks_summary", {
        title: "Tasks summary",
        description: "Background task summary.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getTasksSummary());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "kopia-mcp";
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
    return server;
}
