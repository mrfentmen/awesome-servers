import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { journal, search, detailedSearch } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "doaj-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search open access articles.",
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
    server.registerTool("journal", {
        title: "Journal",
        description: "Search journals.",
        inputSchema: z.object({ query: z.string().describe("Journal name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await journal(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("article_by_doi", {
        title: "Article by DOI",
        description: "Look up one open access article by its DOI, with authors, journal, page range, subjects, full text link and abstract.",
        inputSchema: z.object({ doi: z.string().describe("DOI like 10.1186/s12859-021-03972-5, with or without the doi.org prefix.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement doi locally (paywall removed)
        try {
            return textError("Not yet implemented: doi");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("journal_profile", {
        title: "Journal profile",
        description: "The full DOAJ record for one journal by ISSN: charges, waiver, licence, copyright, peer review, preservation and how much is indexed.",
        inputSchema: z.object({ issn: z.string().describe("ISSN like 2708-5481.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("detailed_search", {
        title: "Detailed search",
        description: "Paged and sorted article search with authors, page ranges, subjects, DOI, full text link and an abstract snippet for each hit.",
        inputSchema: z.object({ query: z.string().describe("Search terms, and DOAJ field queries work too like diabetes AND bibjson.year:2020."), sort: z.string().describe("created_date or last_updated, optionally with :asc or :desc.").optional(), page: z.number().describe("Page number, 1-1000. Defaults to 1.").optional(), limit: z.number().describe("Results per page, 1-100, which is DOAJ own cap. Defaults to 10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await detailedSearch(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "doaj-mcp";
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
