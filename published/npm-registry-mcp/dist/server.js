import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { packageInfo, packageVersions, searchPackages, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "npm-registry-mcp", version: "1.0.0" });
    server.tool("package_info", "Latest version of a package with description, license, dependencies, size and weekly downloads.", {
        name: z.string().describe('Package name, scope allowed, e.g. zod or @modelcontextprotocol/sdk')
    }, async (a) => {
        try {
            return text(await packageInfo(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("search_packages", "Search the npm registry by keyword and rank by npm's own score.", {
        query: z.string().describe('Search text'), limit: z.number().int().min(1).max(25).optional().describe('Results, default 10')
    }, async (a) => {
        try {
            return text(await searchPackages(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("package_versions", "Version history of a package, newest first, with publish dates.", {
        name: z.string().describe('Package name'), limit: z.number().int().min(1).max(50).optional().describe('Versions to show, default 12')
    }, async (a) => {
        try {
            return text(await packageVersions(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
