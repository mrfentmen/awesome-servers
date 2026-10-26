import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchThreads, getThread, listFolders, getUser, documentProfile, wikiArticle, wikiOutline } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "quip-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_threads", {
        title: "Search threads",
        description: "Search Quip docs, spreadsheets and chats by text.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. roadmap"),
        }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            return text(await searchThreads(query));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_thread", {
        title: "Get thread",
        description: "Quip thread with document HTML content.",
        inputSchema: z.object({
            threadId: z.string().describe("Thread ID from the Quip URL"),
        }),
        annotations: READ_ONLY,
    }, async ({ threadId }) => {
        try {
            return text(await getThread(threadId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_folders", {
        title: "List folders",
        description: "Quip folders including shared folders.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listFolders());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_user", {
        title: "Get current user",
        description: "Authenticated Quip user profile.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getUser());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("wiki_article", {
        title: "Article as a document",
        description: "Read an encyclopedia article as a document: its lead, page id, wikitext length, the exact revision it was read at, its knowledge item and its lead image.",
        inputSchema: z.object({
            title: z.string().describe("Article title, e.g. 'Bitcoin' or 'Rust (programming language)'"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await wikiArticle(args.title));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("wiki_outline", {
        title: "Article outline",
        description: "The skeleton of an article: every section heading with its level and anchor, plus the heading count at each level, which is the shape a document has before anyone writes it.",
        inputSchema: z.object({
            title: z.string().describe("Article title to outline, e.g. 'Rust (programming language)'"),
            max_depth: z.number().describe("Show headings down to this level, 1-6. Defaults to 3.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await wikiOutline(args.title, args.max_depth));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("document_profile", {
        title: "Document profile",
        description: "How a document actually reads: word, sentence and paragraph counts, Flesch reading ease and Flesch-Kincaid grade, heading and link counts, the longest word and the longest sentence.",
        inputSchema: z.object({
            text: z.string().describe("The document text to profile, up to 500,000 characters"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await documentProfile(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "quip-mcp";
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
    return server;
}
