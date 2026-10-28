import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { currentAffixes, recentMythicRuns, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "raiderio-mcp", version: "1.0.0" });
    server.tool("current_affixes", "This week's Mythic+ affixes for a region.", {
        region: z.enum(["eu", "us", "kr", "tw", "cn"]).default("eu").describe("Game region")
    }, async (a) => {
        try {
            return text(await currentAffixes(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("recent_mythic_runs", "Recent top Mythic+ runs for the current season.", {
        region: z.enum(["eu", "us", "kr", "tw", "cn"]).default("eu").describe("Game region"),
        season: z.string().default("season-tww-3").describe('Season slug, e.g. "season-tww-3"'),
        limit: z.number().int().min(1).max(25).default(8).describe("Runs to return")
    }, async (a) => {
        try {
            return text(await recentMythicRuns(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
