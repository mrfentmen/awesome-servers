import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatHit, GovInfoError, listCollections, searchPublished, collectionStatistics } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "govinfo-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_collections", {
        title: "List collections",
        description: "GovInfo collections: bills, laws, Register, Record, and more.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const rows = await listCollections();
            if (rows.length === 0)
                return text("No collections.");
            return text(rows.map((c, i) => `${i + 1}. [${c.code}] ${c.name ?? ""}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_published", {
        title: "Search publications",
        description: "Search published U.S. government documents by keyword.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'infrastructure', 'climate'"),
            collection: z.string().default("").describe("Collection code like 'BILLS', empty = all (use list_collections)"),
            limit: z.number().int().min(1).max(100).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, collection, limit }) => {
        try {
            const rows = await searchPublished(query, collection, limit);
            if (rows.length === 0)
                return text(`Nothing found for "${query}".`);
            return text(rows.map((h, i) => formatHit(h, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("federal_register_search", {
        title: "Search the Federal Register",
        description: "Search Federal Register rules, proposed rules and notices by keyword, with optional type, agency and publication-date filters.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'clean air', 'rail safety'"),
            type: z.string().default("").describe("RULE, PRORULE, NOTICE or empty for all"),
            agency: z.string().default("").describe("Agency name fragment, e.g. 'environmental-protection'"),
            publishedAfter: z.string().default("").describe("Only documents published on or after this YYYY-MM-DD date"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            // TODO: implement search locally (paywall removed)
            try {
                return textError("Not yet implemented: search");
            }
            catch (e) {
                return textError(String(e));
            }
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("federal_register_document", {
        title: "Get a Federal Register document",
        description: "One Federal Register document by document number: abstract, CFR citations, docket ids, RIN and effective date.",
        inputSchema: z.object({
            documentNumber: z.string().describe("Document number like 2026-19815 (use federal_register_search)"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            // TODO: implement document locally (paywall removed)
            try {
                return textError("Not yet implemented: document");
            }
            catch (e) {
                return textError(String(e));
            }
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("collection_statistics", {
        title: "GovInfo corpus size by collection",
        description: "How much each GovInfo collection actually holds: package and granule counts, largest first, optionally filtered by name or code.",
        inputSchema: z.object({
            query: z.string().default("").describe("Name or code fragment, e.g. 'bill', 'federal register'. Empty = all collections"),
            limit: z.number().int().min(1).max(60).default(15),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await collectionStatistics({ query, limit }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "govinfo-mcp";
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
function errorMessage(e) {
    if (e instanceof GovInfoError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
