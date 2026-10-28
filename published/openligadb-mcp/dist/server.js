import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { leagues, matches, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "openligadb-mcp", version: "1.0.1" });
    server.tool("leagues", "Every league and season OpenLigaDB holds.", {
        limit: z.number().int().min(1).max(80).default(30).describe("League entries to return"),
        search: z.string().min(2).optional().describe("Only leagues whose name or shortcut contains this text")
    }, async (a) => {
        try {
            return text(await leagues(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("matches", "Matches for a league and season, optionally one matchday.", {
        league: z.string().regex(/^[a-z0-9]{2,12}$/).describe("League shortcut, e.g. bl1, bl2 or dfb"),
        season: z.string().regex(/^\d{4}$/).optional().describe("Season start year, e.g. 2025. Omit for the current season"),
        matchday: z.number().int().min(1).max(40).optional().describe("Matchday number"),
        limit: z.number().int().min(1).max(30).default(9).describe("Matches to return")
    }, async (a) => {
        try {
            return text(await matches(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
