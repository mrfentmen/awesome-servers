import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { network, networkSummary } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "string-db-mcp", version: "1.0.0" });
    server.registerTool("network", {
        title: "Network",
        description: "Interaction partners for a protein.",
        inputSchema: z.object({ proteins: z.string().describe("Comma separated gene names."), species: z.number().describe("NCBI tax id like 9606.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await network(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("top_partners", {
        title: "Top partners",
        description: "Highest-scoring interaction partners for one or more proteins, sorted by combined STRING score.",
        inputSchema: z.object({ proteins: z.string().describe("Comma separated gene names."), species: z.number().describe("NCBI tax id like 9606.").optional(), limit: z.number().describe("Max partners.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement partners locally (paywall removed)
        try {
            return textError("Not yet implemented: partners");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("network_summary", {
        title: "Network summary",
        description: "Network-level STRING summary for a protein set: node and edge counts, average degree, clustering coefficient and enrichment p-value.",
        inputSchema: z.object({ proteins: z.string().describe("Comma separated gene names."), species: z.number().describe("NCBI tax id like 9606.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await networkSummary(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "string-db-mcp";
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
