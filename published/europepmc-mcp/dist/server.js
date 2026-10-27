import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { article, search, searchPage } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "europepmc-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search Europe PMC articles.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("article", {
        title: "Article",
        description: "One article by ID and source.",
        inputSchema: z.object({ extId: z.string().describe("Article ID like 32534363."), source: z.string().describe("Source like MED or PMC.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await article(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_page", {
        title: "Search page",
        description: "Walk a Europe PMC search past the first page with a cursor, optionally sorted by citation count or date.",
        inputSchema: z.object({ query: z.string().describe("Europe PMC query, e.g. covid AND open_access:y."), limit: z.number().describe("Results per page, 1-100. Defaults to 25.").optional(), sort: z.string().describe("CITED desc, P_PDATE_D desc or PUB_YEAR desc. Defaults to relevance.").optional(), cursor: z.string().describe("The cursor from the previous page. Leave empty for the first page.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchPage(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("citations", {
        title: "Citations",
        description: "The papers that cite one article, with authors, journal and year, and paging.",
        inputSchema: z.object({ id: z.string().describe("Article id, like 31986264."), source: z.string().describe("MED or PPR. Inferred from the id when left out.").optional(), limit: z.number().describe("Results per page, 1-100. Defaults to 25.").optional(), page: z.number().describe("Page number, starting at 1.").optional(), sort: z.string().describe("Optional sort, CITED desc, P_PDATE_D desc or PUB_YEAR desc.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement citations locally (paywall removed)
        try {
            return textError("Not yet implemented: citations");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("references", {
        title: "References",
        description: "The papers one article cites, with authors, journal and year, and paging.",
        inputSchema: z.object({ id: z.string().describe("Article id, like 31986264."), source: z.string().describe("MED or PPR. Inferred from the id when left out.").optional(), limit: z.number().describe("Results per page, 1-100. Defaults to 25.").optional(), page: z.number().describe("Page number, starting at 1.").optional(), sort: z.string().describe("Optional sort, CITED desc, P_PDATE_D desc or PUB_YEAR desc.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement references locally (paywall removed)
        try {
            return textError("Not yet implemented: references");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "europepmc-mcp";
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
