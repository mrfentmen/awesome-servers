import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CtanError, formatPackage, getPackage, licenseCatalog } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "ctan-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_package", {
        title: "Get CTAN package",
        description: "Get a CTAN LaTeX package: description, authors, version, paths, install command.",
        inputSchema: z.object({
            key: z.string().describe("Package key, e.g. 'beamer', 'tikz', 'biblatex'"),
        }),
        annotations: READ_ONLY,
    }, async ({ key }) => {
        try {
            return text(formatPackage(await getPackage(key)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_packages", {
        title: "Search CTAN packages",
        description: "Search the whole CTAN catalogue by key, name or caption, ranked so exact and prefix key matches come first.",
        inputSchema: z.object({
            query: z.string().describe("Search terms, e.g. beamer, table, font"),
            limit: z.number().describe("Max results, 1-40.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement packages locally (paywall removed)
        try {
            return textError("Not yet implemented: packages");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("package_provenance", {
        title: "CTAN package provenance",
        description: "Provenance behind a CTAN package: licence keys resolved against CTAN's licence list, authors and copyright years, topics, source repository, issue tracker, TeX Live and MiKTeX names, install bundle and documentation links.",
        inputSchema: z.object({
            key: z.string().describe("Package key, e.g. 'beamer', 'tikz', 'biblatex'"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement provenance locally (paywall removed)
        try {
            return textError("Not yet implemented: provenance");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("license_catalog", {
        title: "CTAN license catalog",
        description: "The licence keys CTAN itself uses, each with its name and whether CTAN marks it free, so a package licence can be read as free or not.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (_args) => {
        try {
            return text(await licenseCatalog(_args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ctan-mcp";
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
    if (e instanceof CtanError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
