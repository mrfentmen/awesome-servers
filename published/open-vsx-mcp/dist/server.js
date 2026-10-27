import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatExtension, formatHit, getExtension, OpenVsxError, searchExtensions } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "open-vsx-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_extensions", {
        title: "Search extensions",
        description: "Search Open VSX for VS Code extensions: descriptions, download counts.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'python', 'vim', 'theme'"),
            limit: z.number().int().min(1).max(50).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const results = await searchExtensions(query, limit);
            if (results.length === 0)
                return text(`No Open VSX extensions match "${query}".`);
            return text(`Open VSX results for "${query}":\n\n${results.map((e, i) => formatHit(e, i)).join("\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_extension", {
        title: "Get extension details",
        description: "Get an Open VSX extension: version, license, links, recent versions.",
        inputSchema: z.object({
            namespace: z.string().describe("Publisher namespace, e.g. 'rust-lang' (case-sensitive)"),
            name: z.string().describe("Extension name, e.g. 'rust-analyzer' (case-sensitive)"),
        }),
        annotations: READ_ONLY,
    }, async ({ namespace, name }) => {
        try {
            return text(formatExtension(await getExtension(namespace, name)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("namespace_search", {
        title: "Namespace search",
        description: "Search inside one extension namespace on open-vsx.org, which a free-text search cannot narrow to a single vendor.",
        inputSchema: z.object({ namespace: z.string().describe("Namespace, e.g. ms-python."), query: z.string().describe("Search term; leave empty for everything.").optional(), limit: z.number().describe("Max extensions.").optional() }),
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
    server.registerTool("publisher_extensions", {
        title: "Publisher extensions",
        description: "Every extension one publisher has released on open-vsx.org with version, rating and download count, which is how you audit a vendor's catalogue.",
        inputSchema: z.object({ publisher: z.string().describe("Publisher id, e.g. ms-python."), limit: z.number().describe("Max extensions.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement extensions locally (paywall removed)
        try {
            return textError("Not yet implemented: extensions");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "open-vsx-mcp";
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
function errorMessage(e) {
    if (e instanceof OpenVsxError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
