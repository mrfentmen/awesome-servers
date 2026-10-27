import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { user, collections, raindrops, linkPreview, bookLookup } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "raindrop-mcp",
        version: "1.0.0",
    });
    server.registerTool("user", {
        title: "User",
        description: "The Raindrop account the token belongs to.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await user());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("collections", {
        title: "Collections",
        description: "Bookmark collections with counts and ids.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await collections());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("raindrops", {
        title: "Bookmarks",
        description: "Bookmarks in one collection, with tags and links.",
        inputSchema: z.object({
            collection_id: z.string().describe("Collection ID (0 = all).")
        }),
        annotations: READ_ONLY,
    }, async ({ collection_id }) => {
        try {
            return text(await raindrops(collection_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("link_preview", {
        title: "Link preview",
        description: "What a link actually is before it is saved: the site's oEmbed card when it has one, otherwise its Open Graph and Twitter card tags, its title, canonical link and the HTTP status the link returns right now.",
        inputSchema: z.object({
            url: z.string().describe("URL to inspect, e.g. 'https://blog.rust-lang.org/2025/09/18/Rust-1.90.0/'"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await linkPreview(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("book_lookup", {
        title: "Book lookup",
        description: "What a book actually is, from Open Library: its description, first publication date, how many editions are catalogued, its subjects, its average rating and the ISBNs on file.",
        inputSchema: z.object({
            title: z.string().describe("Book title, e.g. 'The Dispossessed'"),
            author: z.string().describe("Author, to disambiguate.").optional(),
            limit: z.number().describe("Max matching works, 1-15. Defaults to 5.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await bookLookup(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "raindrop-mcp";
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
