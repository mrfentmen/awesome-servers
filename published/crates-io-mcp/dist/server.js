import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { crateDependencies, crateInfo, CratesError, crateOwners, crateVersions, downloadTrend, searchCrates, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof CratesError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "crates-io-mcp", version: "1.0.7" });
    server.tool("search_crates", "Search Rust crates on crates.io, with download counts.", {
        query: z.string().min(1).describe("Search term, e.g. serde"),
        limit: z.number().int().min(1).max(50).default(10).describe("Results"),
        sort: z
            .enum(["relevance", "downloads", "recent-downloads", "new", "recent-updates"])
            .default("relevance")
            .describe("Sort order"),
    }, async ({ query, limit, sort }) => {
        try {
            return text(await searchCrates(query, limit, sort));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("crate_info", "Downloads, latest version, repository and metadata for one crate.", { name: z.string().min(1).describe("Crate name, e.g. serde") }, async ({ name }) => {
        try {
            return text(await crateInfo(name));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("crate_versions", "Recent release history for a crate, newest first.", {
        name: z.string().min(1).describe("Crate name"),
        limit: z.number().int().min(1).max(50).default(10).describe("Versions to return"),
    }, async ({ name, limit }) => {
        try {
            return text(await crateVersions(name, limit));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("crate_owners", "Current owners (maintainers) of a crate.", { name: z.string().min(1).describe("Crate name") }, async ({ name }) => {
        try {
            return text(await crateOwners(name));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("crate_dependencies", "What a crate depends on, grouped into normal, build and dev requirements.", {
        name: z.string().min(1).describe("Crate name"),
        version: z.string().optional().describe("Version; omit for the latest"),
    }, async ({ name, version }) => {
        try {
            return text(await crateDependencies(name, version));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("download_trend", "Day-by-day download totals for a crate, newest first.", { name: z.string().min(1).describe("Crate name") }, async ({ name }) => {
        try {
            return text(await downloadTrend(name));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
