import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, schema_versions } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "json-schema-store-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search schemas in the catalog.",
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
    server.registerTool("match_filename", {
        title: "Match a file name",
        description: "Find the Schema Store schemas that claim a given file name or path, using the fileMatch globs the catalog carries on 1,348 of its entries, which is how Schema Store is meant to be used. Matches the pattern against both the full path and the bare file name, reports which pattern matched, and warns when more than one schema claims the full path. The existing search tool matches a query against names and descriptions, so it cannot answer which schema belongs to a file at all.",
        inputSchema: z.object({
            path: z.string().min(1).max(400).describe("File name or path, e.g. '.github/workflows/ci.yml' or 'tsconfig.json'."),
            limit: z.number().int().min(1).max(25).optional().describe("How many matches to show. Default 10."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement filename locally (paywall removed)
        try {
            return textError("Not yet implemented: filename");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("schema_versions", {
        title: "Schema versions",
        description: "Show the upstream versions a named schema is pinned to, with each version's URL, the file names it claims, and whether the current url is one of the pinned versions or something separate. Reports plainly when a schema pins no versions, so its address can change without notice. The existing search tool prints a name and a description and nothing else.",
        inputSchema: z.object({
            name: z.string().min(1).describe("Schema name as the store lists it, e.g. 'Ameba' or 'GitHub Action'."),
        }),
        annotations: READ_ONLY,
    }, async ({ name }) => {
        try {
            return text(await schema_versions({ name }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("catalog_census", {
        title: "Catalog census",
        description: "Report the shape of the whole Schema Store catalog rather than a slice of it: how many schemas it holds, how many carry a description and a usable url, how many claim file names and how many patterns that is, how many pin upstream versions, which hosts serve the store and what share of it the largest provides, how the names are shaped and therefore what a caller has to type, and whether any name is duplicated. The existing search tool slices the catalog to 500 entries and reports none of this.",
        inputSchema: z.object({
            limit: z.number().int().min(5).max(40).optional().describe("How many hosts to list. Default 15."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement census locally (paywall removed)
        try {
            return textError("Not yet implemented: census");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("schema_digest", {
        title: "Schema digest",
        description: "Open a Schema Store schema document and report what it asserts: dialect, size, root properties, named subschemas and how often each constraining keyword appears.",
        inputSchema: z.object({ name: z.string().describe("Schema name from the store, e.g. tsconfig.json.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement digest locally (paywall removed)
        try {
            return textError("Not yet implemented: digest");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("schema_refs", {
        title: "Schema references",
        description: "Every $ref a Schema Store schema document makes, grouped by target and listing the external files it depends on. The catalog index carries no references, so this is only readable from the document itself.",
        inputSchema: z.object({ name: z.string().describe("Schema name from the store, e.g. tsconfig.json.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement refs locally (paywall removed)
        try {
            return textError("Not yet implemented: refs");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "json-schema-store-mcp";
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
    return server;
}
