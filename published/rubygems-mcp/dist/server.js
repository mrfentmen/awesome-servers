import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { gemInfo, gemOwners, gemVersions, latestReleases, reverseDependencies, RubyGemsError, searchGems, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof RubyGemsError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
const gemArg = z.string().min(1).describe("Gem name, e.g. rails");
export function createServer() {
    const server = new McpServer({ name: "rubygems-mcp", version: "1.0.3" });
    server.tool("search_gems", "Search rubygems.org for gems by keyword.", {
        query: z.string().min(1).describe("Search term, e.g. rails"),
        limit: z.number().int().min(1).max(50).default(10).describe("Results"),
    }, async ({ query, limit }) => {
        try {
            return text(await searchGems(query, limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("gem_info", "Downloads, authors, license and links for one gem.", { name: gemArg }, async ({ name }) => {
        try {
            return text(await gemInfo(name));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("gem_versions", "Release history for a gem, newest first.", { name: gemArg }, async ({ name }) => {
        try {
            return text(await gemVersions(name));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("latest_releases", "Gems published most recently on rubygems.org.", { limit: z.number().int().min(1).max(50).default(15).describe("Gems to return") }, async ({ limit }) => {
        try {
            return text(await latestReleases(limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("reverse_dependencies", "Gems that depend on the given gem.", {
        name: gemArg,
        limit: z.number().int().min(1).max(100).default(20).describe("Results"),
    }, async ({ name, limit }) => {
        try {
            return text(await reverseDependencies(name, limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("gem_owners", "Current owners of a gem.", { name: gemArg }, async ({ name }) => {
        try {
            return text(await gemOwners(name));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
