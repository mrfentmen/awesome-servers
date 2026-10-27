import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { instance, publicTimeline } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "pixelfed-mcp", version: "1.0.0" });
    server.registerTool("instance", {
        title: "Instance",
        description: "Get Pixelfed instance info.",
        inputSchema: z.object({ instance: z.string().describe("Instance host like pixelfed.social.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await instance(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("public_timeline", {
        title: "Public timeline",
        description: "Get public posts.",
        inputSchema: z.object({ instance: z.string().describe("Instance host.").optional(), limit: z.number().describe("Max posts.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await publicTimeline(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("trending_tags", {
        title: "Trending tags",
        description: "Trending hashtags on a fediverse server, with the number of posts and accounts using each today.",
        inputSchema: z.object({ instance: z.string().describe("Server host. Defaults to fediscience.org, which serves this endpoint.").optional(), limit: z.number().describe("Max tags, 1-20, default 10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement tags locally (paywall removed)
        try {
            return textError("Not yet implemented: tags");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("server_rules", {
        title: "Server rules",
        description: "The community rules a fediverse server publishes, as text.",
        inputSchema: z.object({ instance: z.string().describe("Server host. Defaults to fediscience.org, which serves this endpoint.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement rules locally (paywall removed)
        try {
            return textError("Not yet implemented: rules");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("instance_activity", {
        title: "Instance activity",
        description: "Weekly post, login and registration counts for a fediverse server.",
        inputSchema: z.object({ instance: z.string().describe("Server host. Defaults to fediscience.org, which serves this endpoint.").optional(), weeks: z.number().describe("Weeks to show, 1-26, default 8.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement activity locally (paywall removed)
        try {
            return textError("Not yet implemented: activity");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "pixelfed-mcp";
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
