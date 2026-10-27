import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { posts, todos, users } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "jsonplaceholder-mcp", version: "1.0.0" });
    server.registerTool("todos", {
        title: "Todos",
        description: "List todos.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await todos(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("posts", {
        title: "Posts",
        description: "List posts.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await posts(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("users", {
        title: "Users",
        description: "List users.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await users(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("comments", {
        title: "Comments",
        description: "JSONPlaceholder comments with their name, email and body, optionally just the ones on one post.",
        inputSchema: z.object({ post_id: z.number().describe("Restrict to one post id, 1 to 100.").optional(), limit: z.number().describe("Max comments.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement comments locally (paywall removed)
        try {
            return textError("Not yet implemented: comments");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("albums", {
        title: "Albums",
        description: "The JSONPlaceholder albums, optionally just one user's.",
        inputSchema: z.object({ user_id: z.number().describe("Restrict to one user id, 1 to 10.").optional(), limit: z.number().describe("Max albums.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement albums locally (paywall removed)
        try {
            return textError("Not yet implemented: albums");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "jsonplaceholder-mcp";
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
