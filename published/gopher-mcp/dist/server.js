import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DEFAULT_GHOST, DEFAULT_PORT, GopherError, cleanText, formatItem, gopherFetch, parseMenu } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "gopher-mcp",
        version: "1.0.0",
    });
    server.registerTool("open_menu", {
        title: "Open menu",
        description: "Open a Gopher menu (directory) and list its items. The default " +
            "server is gopher.floodgap.com — one of the oldest still-running " +
            "gopher servers. Pass a selector like '/' for the root, or a path " +
            "like '/1/floodgap'.",
        inputSchema: z.object({
            host: z.string().default(DEFAULT_GHOST).describe("Gopher host (no scheme)"),
            selector: z.string().default("/").describe("Menu selector, e.g. '/' or '/1/floodgap'"),
            port: z.number().int().default(DEFAULT_PORT).describe("Gopher port, usually 70"),
        }),
        annotations: READ_ONLY,
    }, async ({ host, selector, port }) => {
        try {
            const body = await gopherFetch(host, selector, port);
            const items = parseMenu(body, host);
            if (items.length === 0)
                return text(`Empty menu at gopher://${host}:${port}/${selector}`);
            return text(`gopher://${host}:${port}/${selector}\n\n` +
                items.map((it, i) => formatItem(it, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("read_textfile", {
        title: "Read textfile",
        description: "Read a plain-text file from gopherspace (gopher type 0). Useful for " +
            "the floodgap texts, old FAQ collections, and historical documents.",
        inputSchema: z.object({
            host: z.string().default(DEFAULT_GHOST),
            selector: z.string().describe("File selector, e.g. '/0/floodgap/new'"),
            maxChars: z.number().int().min(500).max(50000).default(10000),
        }),
        annotations: READ_ONLY,
    }, async ({ host, selector, maxChars }) => {
        try {
            const body = await gopherFetch(host, selector);
            const cleaned = cleanText(body);
            if (!cleaned.trim())
                return text(`Empty file at gopher://${host}/${selector}`);
            return text(cleaned.slice(0, maxChars));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_veronica", {
        title: "Search veronica",
        description: "Run a Gopher search (type 7) — e.g. a Veronica-2 search on " +
            "gopher.floodgap.com (selector '/7/v2/vs'). Returns matching items " +
            "as a menu.",
        inputSchema: z.object({
            host: z.string().default(DEFAULT_GHOST),
            selector: z.string().default("/v2/vs").describe("Search selector, typically /v2/vs on floodgap"),
            query: z.string().describe("Search terms"),
            port: z.number().int().default(DEFAULT_PORT),
        }),
        annotations: READ_ONLY,
    }, async ({ host, selector, query, port }) => {
        try {
            const body = await gopherFetch(host, `${selector}\t${query}`, port);
            const items = parseMenu(body, host);
            if (items.length === 0)
                return text(`No results for "${query}" on ${host}.`);
            return text(`Veronica search "${query}" via gopher://${host}:${port}/${selector}\n\n` +
                items.slice(0, 40).map((it, i) => formatItem(it, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("menu_inventory", {
        title: "Menu inventory",
        description: "Read a gopher menu as a typed inventory: how many directories, files, urls and error lines it holds, then each link as a full gopher url.",
        inputSchema: z.object({ selector: z.string().describe("Menu path, e.g. / or /1/floodgap.").optional(), host: z.string().describe("Gopher host.").optional(), port: z.number().describe("Gopher port.").optional(), limit: z.number().describe("Max links.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement inventory locally (paywall removed)
        try {
            return textError("Not yet implemented: inventory");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("menu_search", {
        title: "Menu search",
        description: "Search a gopher menu's entry labels and selectors for a string, which is how you find your way through a large gopher tree.",
        inputSchema: z.object({ selector: z.string().describe("Menu path to search.").optional(), query: z.string().describe("Text to look for."), host: z.string().describe("Gopher host.").optional(), port: z.number().describe("Gopher port.").optional(), limit: z.number().describe("Max matches.").optional() }),
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
    const serverName = "gopher-mcp";
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
function errorMessage(e) {
    if (e instanceof GopherError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
