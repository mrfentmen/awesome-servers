import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getBooks, getBooksByState, getBook, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "literal-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_books", {
        title: "Get my books",
        description: "Books in your Literal library with authors and covers, newest first.",
        inputSchema: z.object({
            limit: z.number().default(20).describe("How many books"),
            search: z.string().optional().describe("Search within library"),
        }),
        annotations: READ_ONLY,
    }, async ({ limit, search }) => {
        try {
            return text(await getBooks(limit, search));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_books_by_state", {
        title: "Get books by state",
        description: "Your Literal books filtered by reading state.",
        inputSchema: z.object({
            state: z.string().describe("One of IS_READING, WANTS_TO_READ, FINISHED, ABANDONED"),
            limit: z.number().default(20).describe("How many"),
        }),
        annotations: READ_ONLY,
    }, async ({ state, limit }) => {
        try {
            return text(await getBooksByState(state, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_book", {
        title: "Look up book",
        description: "Literal book detail by slug with authors and description.",
        inputSchema: z.object({
            slug: z.string().describe("Book slug"),
        }),
        annotations: READ_ONLY,
    }, async ({ slug }) => {
        try {
            return text(await getBook(slug));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "literal-mcp";
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
