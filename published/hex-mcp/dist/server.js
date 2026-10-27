import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatPackage, formatRelease, getPackage, getRelease, HexError, packageOwners } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "hex-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_package", {
        title: "Get package info",
        description: "Get a Hex package: description, latest version, downloads, docs, licenses, releases.",
        inputSchema: z.object({
            name: z.string().describe("Package name, e.g. 'phoenix'"),
        }),
        annotations: READ_ONLY,
    }, async ({ name }) => {
        try {
            return text(formatPackage(await getPackage(name)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_release", {
        title: "Get release details",
        description: "Get one Hex release: publish date, checksum, requirements.",
        inputSchema: z.object({
            name: z.string().describe("Package name, e.g. 'phoenix'"),
            version: z.string().describe("Version, e.g. '1.7.0' (use get_package to find it)"),
        }),
        annotations: READ_ONLY,
    }, async ({ name, version }) => {
        try {
            return text(formatRelease(name, await getRelease(name, version)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_packages", {
        title: "Search packages",
        description: "Search the Hex package registry by name or description, sorted by downloads, recent downloads, name or update date.",
        inputSchema: z.object({
            query: z.string().describe("Search term, e.g. json."),
            sort: z.string().describe("downloads, recent_downloads, name or updated_at.").optional(),
            limit: z.number().int().min(1).max(50).default(10),
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
    server.registerTool("package_owners", {
        title: "Package owners",
        description: "List a Hex package's owners with their public names and permission levels.",
        inputSchema: z.object({ name: z.string().min(1).max(200).describe("Hex package name, e.g. phoenix."), limit: z.number().int().min(1).max(50).optional().describe("Maximum owners, default 20.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await packageOwners(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("maintainer_packages", {
        title: "Maintainer packages",
        description: "List the public packages owned by a Hex maintainer, with their repositories and package links.",
        inputSchema: z.object({ username: z.string().min(1).max(200).describe("Hex username, e.g. ericmj."), limit: z.number().int().min(1).max(50).optional().describe("Maximum packages, default 20.") }),
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
    server.registerTool("dependency_changes", {
        title: "Dependency changes",
        description: "Compare two Hex releases for added, removed and changed direct dependency requirements, optional flags, applications, repositories and Elixir requirements.",
        inputSchema: z.object({ name: z.string().min(1).max(200).describe("Hex package name, e.g. phoenix."), before: z.string().min(1).max(200).describe("Earlier release, e.g. 1.7.0."), after: z.string().min(1).max(200).describe("Later release, e.g. 1.8.0."), limit: z.number().int().min(1).max(50).optional().describe("Maximum changes, default 20.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement changes locally (paywall removed)
        try {
            return textError("Not yet implemented: changes");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "hex-mcp";
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
function errorMessage(e) {
    if (e instanceof HexError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
