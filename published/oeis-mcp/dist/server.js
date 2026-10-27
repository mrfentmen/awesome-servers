import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatSequence, getSequence, OeisError, searchSequences } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "oeis-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_sequences", {
        title: "Search sequences",
        description: "Search the OEIS by terms or a name query. Terms like '1,1,2,3,5,8' find sequences containing them.",
        inputSchema: z.object({ query: z.string().describe("Comma separated terms, a keyword, or a phrase, e.g. '1,1,2,3' or 'prime gaps'"), limit: z.number().int().min(1).max(10).default(5) }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const results = await searchSequences(query, limit);
            if (results.length === 0)
                return text(`No OEIS sequences match "${query}".`);
            return text(`OEIS results for "${query}":\n\n${results.map((s, i) => formatSequence(s, i)).join("\n\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_sequence", {
        title: "Get sequence",
        description: "Get one OEIS sequence by its A number.",
        inputSchema: z.object({ id: z.string().describe("A number, e.g. 'A000045'") }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            const s = await getSequence(id);
            if (!s)
                return text(`No OEIS sequence ${id}.`);
            return text(formatSequence(s));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("sequence_terms", {
        title: "Sequence terms",
        description: "The full term list of an OEIS sequence from its b-file: every term with its index, plus the file's own offset header.",
        inputSchema: z.object({ id: z.string().describe("OEIS id like A000045."), start: z.number().describe("Terms to skip.").optional(), count: z.number().describe("How many terms.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement terms locally (paywall removed)
        try {
            return textError("Not yet implemented: terms");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "oeis-mcp";
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
function errorMessage(e) {
    if (e instanceof OeisError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
