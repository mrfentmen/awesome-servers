import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LaunchLibraryError, launchDetail, launchesBySearch, listAgencies, recentLaunches, upcomingEvents, upcomingLaunches, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof LaunchLibraryError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "launch-library-mcp", version: "1.0.0" });
    const limit = z.number().int().min(1).max(25).default(8).describe("Rows to return (1-25)");
    server.tool("upcoming_launches", "The next rocket launches worldwide, soonest first.", { limit }, async ({ limit: n }) => {
        try {
            return text(await upcomingLaunches(n));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("recent_launches", "The most recent launches, newest first, with outcomes.", { limit }, async ({ limit: n }) => {
        try {
            return text(await recentLaunches(n));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("launch_detail", "One launch with window, mission, orbit and image.", { id: z.string().min(20).describe("Launch id from any list tool") }, async ({ id }) => {
        try {
            return text(await launchDetail(id));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("search_launches", "Search the full launch history by name — rocket, mission or provider.", {
        term: z.string().min(2).describe("Search term, e.g. 'Falcon Heavy' or 'Starship'"),
        limit,
    }, async ({ term, limit: n }) => {
        try {
            return text(await launchesBySearch(term, n));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("upcoming_events", "Upcoming space events beyond launches, e.g. dockings and tests.", { limit }, async ({ limit: n }) => {
        try {
            return text(await upcomingEvents(n));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("list_agencies", "Featured space agencies, optionally filtered by country code.", {
        limit,
        country: z.string().min(2).max(3).optional().describe("ISO country code — 3 letters work best (USA, JPN)"),
    }, async ({ limit: n, country }) => {
        try {
            return text(await listAgencies(n, country));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
