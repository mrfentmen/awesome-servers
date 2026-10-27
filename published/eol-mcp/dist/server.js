import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { page, search } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "eol-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search species.",
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
    server.registerTool("page", {
        title: "Page",
        description: "Get a species page.",
        inputSchema: z.object({ id: z.number().describe("Taxon id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await page(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("taxon_classifications", {
        title: "Taxon classifications",
        description: "Show how each taxonomic authority classifies an EOL taxon, with the separate EOL page id each authority uses, since one scientific name can resolve to several records.",
        inputSchema: z.object({ id: z.number().describe("EOL taxon id, e.g. 1268547.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement classifications locally (paywall removed)
        try {
            return textError("Not yet implemented: classifications");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("paged_search", {
        title: "Paged species search",
        description: "Page through EOL species search results, reporting the total match count and the common names recorded for each hit, for exploring beyond the first page of matches.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), page: z.number().describe("First page to fetch, 1 based.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement search locally (paywall removed)
        try {
            return textError("Not yet implemented: search");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "eol-mcp";
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
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
