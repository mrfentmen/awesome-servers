import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { doi, search, prefixDetails } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "datacite-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search DOIs by query.",
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
    server.registerTool("doi", {
        title: "Doi",
        description: "Details for one DOI.",
        inputSchema: z.object({ doi: z.string().describe("DOI like 10.5281/zenodo.20501604.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await doi(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("doi_metadata", {
        title: "DOI metadata",
        description: "Full DataCite record for one DOI: creators with affiliations and ORCIDs, contributors, subjects, container title, rights, related identifiers, geo locations, funding awards, formats and state.",
        inputSchema: z.object({ doi: z.string().describe("Full DOI, e.g. 10.5281/zenodo.23003105.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement metadata locally (paywall removed)
        try {
            return textError("Not yet implemented: metadata");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("creator_dois", {
        title: "Creator DOIs",
        description: "Find every DOI in DataCite that lists a given creator, with publisher and year breakdowns across the returned page.",
        inputSchema: z.object({ creator: z.string().describe("Creator name, e.g. Seagal."), limit: z.number().describe("Max DOIs.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement dois locally (paywall removed)
        try {
            return textError("Not yet implemented: dois");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("prefix_details", {
        title: "Prefix details",
        description: "DataCite registration details for a DOI prefix including its member clients, plus the most recent DOIs registered under that prefix.",
        inputSchema: z.object({ prefix: z.string().describe("Bare prefix, e.g. 10.5281."), limit: z.number().describe("Max DOIs.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await prefixDetails(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    const serverName = "datacite-mcp";
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
