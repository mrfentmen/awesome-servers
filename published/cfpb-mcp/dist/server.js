import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "cfpb-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search complaints.",
        inputSchema: z.object({ company: z.string().describe("Company name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("complaint_facets", {
        title: "Complaint facets",
        description: "Server side Elasticsearch facet counts for CFPB consumer complaints, by product, state, issue, company, response, timeliness, channel or tag, with share of the matching set.",
        inputSchema: z.object({ search_term: z.string().describe("Free text, e.g. a company name.").optional(), product: z.string().describe("Exact CFPB product name, e.g. Mortgage.").optional(), facet: z.string().describe("product, state, issue, company, company_response, company_public_response, timely, submitted_via or tags.").optional(), limit: z.number().describe("Max buckets per facet.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement facets locally (paywall removed)
        try {
            return textError("Not yet implemented: facets");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("product_catalogue", {
        title: "Product catalogue",
        description: "Every CFPB complaint product category with its live complaint volume and share of the whole corpus.",
        inputSchema: z.object({ limit: z.number().describe("Max categories.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement catalogue locally (paywall removed)
        try {
            return textError("Not yet implemented: catalogue");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "cfpb-mcp";
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
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    return server;
}
