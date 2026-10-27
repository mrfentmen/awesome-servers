import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { object, objects, mockPosts } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "restful-api-dev-mcp", version: "1.0.0" });
    server.registerTool("objects", {
        title: "Objects",
        description: "List test objects.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await objects(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("object", {
        title: "Object",
        description: "Get one object.",
        inputSchema: z.object({ id: z.string().describe("Object id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await object(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("mock_users", {
        title: "Mock users",
        description: "Sample user records from the public jsonplaceholder test REST API, with address, phone and company fields.",
        inputSchema: z.object({ limit: z.number().describe("Max results, 1 to 20.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement users locally (paywall removed)
        try {
            return textError("Not yet implemented: users");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("mock_posts", {
        title: "Mock posts",
        description: "Sample post records from the public jsonplaceholder test REST API, with author id and body text.",
        inputSchema: z.object({ limit: z.number().describe("Max results, 1 to 20.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await mockPosts(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("post_comments", {
        title: "Post comments",
        description: "The comments left on one jsonplaceholder post, from the public test REST API.",
        inputSchema: z.object({ post_id: z.string().describe("Numeric post id, e.g. 1.") }),
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
    const serverName = "restful-api-dev-mcp";
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
