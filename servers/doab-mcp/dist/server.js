import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, searchBooks, getItem, collectionItems } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "doab-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_books", {
        title: "Search books",
        description: "Search DOAB open access books by keyword with handles and dates.",
        inputSchema: z.object({
            query: z.string().describe("Search text"),
        }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            return text(await searchBooks(query));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_item", {
        title: "Get item by handle",
        description: "DOAB record by handle prefix and suffix, e.g. 20.500.12854 and 170275.",
        inputSchema: z.object({
            prefix: z.string().describe("Handle prefix"),
            suffix: z.string().describe("Handle suffix"),
        }),
        annotations: READ_ONLY,
    }, async ({ prefix, suffix }) => {
        try {
            return text(await getItem(prefix, suffix));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("browse_directory", {
        title: "Browse the directory",
        description: "List DOAB's own structure: its top-level communities or collections, or the children of one you name by handle.",
        inputSchema: z.object({ kind: z.string().describe("collections or communities.").optional(), parent: z.string().describe("Parent handle, e.g. 20.500.12854/6.").optional(), limit: z.number().describe("Max entries.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: browse_directory ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_doab_browse_directory", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("item_metadata", {
        title: "Item metadata",
        description: "One DOAB item with its metadata expanded: title, author, date, language, abstract, license and the collections it belongs to.",
        inputSchema: z.object({ handle: z.string().describe("DOAB handle, e.g. 20.500.12854/70295.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: item_metadata ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_doab_item_metadata", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("collection_items", {
        title: "Collection items",
        description: "Page through records in a DOAB collection using its UUID, with handles and modification dates.",
        inputSchema: z.object({ collection: z.string().describe("Collection UUID from DOAB, e.g. 5f10d8e9-bb77-4dc7-b144-0cf4382176fb."), limit: z.number().int().optional(), offset: z.number().int().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await collectionItems(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("item_files", {
        title: "Item files",
        description: "Find downloadable files and bibliographic exports attached to a DOAB item, including MIME types, byte sizes and download URLs.",
        inputSchema: z.object({ item: z.string().describe("Item UUID from DOAB metadata."), limit: z.number().int().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: item_files ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_doab_item_files", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
