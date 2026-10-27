import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { querySubgraph, getSubgraphSchema, getLatestBlock, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "thegraph-mcp",
        version: "1.0.0",
    });
    server.registerTool("query_subgraph", {
        title: "Query a subgraph",
        description: "Run GraphQL against a subgraph on The Graph decentralized network. Example query: '{ _meta { block { number } } }'. Variables as JSON string.",
        inputSchema: z.object({
            subgraphId: z.string().describe("Subgraph id, e.g. the Uniswap v3 id"),
            query: z.string().describe("GraphQL query"),
            variables: z.string().optional().describe("Variables as JSON object string"),
        }),
        annotations: READ_ONLY,
    }, async ({ subgraphId, query, variables }) => {
        try {
            return text(await querySubgraph(subgraphId, query, variables));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_subgraph_schema", {
        title: "Get subgraph schema",
        description: "Fetch the GraphQL schema of a subgraph via introspection: entities and fields you can query.",
        inputSchema: z.object({
            subgraphId: z.string().describe("Subgraph id"),
        }),
        annotations: READ_ONLY,
    }, async ({ subgraphId }) => {
        try {
            return text(await getSubgraphSchema(subgraphId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_latest_block", {
        title: "Get indexed block",
        description: "Latest block a subgraph has indexed: chain, number, hash, timestamp.",
        inputSchema: z.object({
            subgraphId: z.string().describe("Subgraph id"),
        }),
        annotations: READ_ONLY,
    }, async ({ subgraphId }) => {
        try {
            return text(await getLatestBlock(subgraphId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "thegraph-mcp";
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
