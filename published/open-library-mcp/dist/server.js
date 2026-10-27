import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_formatAuthor, m0_formatBook, m0_formatWork, m0_getAuthor, m0_getEditions, m0_getWork, m0_searchBooks, m1_lookup, m1_validate } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
const m0_key = z.string().min(1).describe("Open Library key such as /works/OL123W or OL123W");
export function createServer() {
    const server = new McpServer({ name: 'open-library-mcp', version: '1.0.0' });
    server.registerTool("search_books", {
        title: "Search books",
        description: "Search Open Library for books, authors, subjects, or ISBNs.",
        inputSchema: z.object({ query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const result = await m0_searchBooks(query, limit);
            return text(`Open Library found ${result.numFound ?? 0} result(s) for "${query}":\n\n${(result.docs ?? []).map((d, i) => m0_formatBook(d, i)).join("\n\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_work", {
        title: "Get work",
        description: "Get detailed metadata for an Open Library work.",
        inputSchema: z.object({ m0_key }),
        annotations: READ_ONLY,
    }, async ({ m0_key: workKey }) => { try {
        return text(m0_formatWork(await m0_getWork(workKey)));
    }
    catch (e) {
        return textError(String(e));
    } });
    server.registerTool("get_author", {
        title: "Get author",
        description: "Get metadata for an Open Library author.",
        inputSchema: z.object({ m0_key }),
        annotations: READ_ONLY,
    }, async ({ m0_key: authorKey }) => { try {
        return text(m0_formatAuthor(await m0_getAuthor(authorKey)));
    }
    catch (e) {
        return textError(String(e));
    } });
    server.registerTool("list_editions", {
        title: "List editions",
        description: "List editions of an Open Library work.",
        inputSchema: z.object({ m0_key, limit: z.number().int().min(1).max(50).default(20) }),
        annotations: READ_ONLY,
    }, async ({ m0_key: workKey, limit }) => { try {
        const result = await m0_getEditions(workKey, limit);
        return text(`Editions for ${workKey}:\n\n${(result.docs ?? []).map((d, i) => m0_formatBook(d, i)).join("\n\n")}`);
    }
    catch (e) {
        return textError(String(e));
    } });
    server.registerTool("validate", {
        title: "Validate",
        description: "Check an ISBN 10 or ISBN 13 checksum.",
        inputSchema: z.object({ isbn: z.string().describe("The ISBN to check.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_validate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("lookup", {
        title: "Lookup",
        description: "Look up a book by ISBN.",
        inputSchema: z.object({ isbn: z.string().describe("The ISBN to look up.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_lookup(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("author_works", {
        title: "Author works",
        description: "Every work an author has in Open Library, with publication dates and cover links - the author record itself only carries a work count.",
        inputSchema: z.object({ author: z.string().describe("Open Library author key, e.g. OL45804A."), limit: z.number().describe("Max works.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement works locally (paywall removed)
        try {
            return textError("Not yet implemented: works");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("subject_works", {
        title: "Subject works",
        description: "Browse an Open Library subject shelf such as science_fiction, listing the works and how many the subject holds in total.",
        inputSchema: z.object({ subject: z.string().describe("Subject key, e.g. science_fiction."), limit: z.number().describe("Max works.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement works locally (paywall removed)
        try {
            return textError("Not yet implemented: works");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "open-library-mcp";
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
    return server;
}
