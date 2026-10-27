import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { auth, listBooks, listHighlights, paperSearch, paperReferences } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "readwise-mcp",
        version: "1.0.0",
    });
    server.registerTool("auth", {
        title: "Auth check",
        description: "Check that the Readwise token works.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await auth());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_books", {
        title: "List books",
        description: "Library sources: books, articles and podcasts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listBooks());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_highlights", {
        title: "Highlights",
        description: "Recent highlights across the library.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listHighlights());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("paper_search", {
        title: "Literature search",
        description: "Search the published literature through Crossref, ranked by citation count, with authors, year, venue, DOI and reference count for each result.",
        inputSchema: z.object({
            query: z.string().describe("Topic or paper title, e.g. 'attention is all you need'"),
            limit: z.number().describe("Max results, 1-25. Defaults to 10.").optional(),
            from_year: z.number().describe("Only works published in this year or later.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await paperSearch({ query: args.query, limit: args.limit, fromYear: args.from_year }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("paper_references", {
        title: "Paper references",
        description: "One paper's reference list as the publisher deposited it, with how many times it has been cited, the span of years it draws on, and how many of its references carry their own DOI.",
        inputSchema: z.object({
            doi: z.string().describe("DOI or doi.org URL, e.g. '10.1109/cvpr.2016.91'"),
            limit: z.number().describe("Max references listed, 1-50. Defaults to 20.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await paperReferences(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "readwise-mcp";
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
