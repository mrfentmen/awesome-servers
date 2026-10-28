import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { driverStandings, raceResults, schedule, seasons, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "f1-mcp", version: "1.0.0" });
    server.tool("seasons", "Every Formula 1 season on record, newest first.", {
        limit: z.number().int().min(1).max(30).default(10).describe("Seasons to list")
    }, async (a) => {
        try {
            return text(await seasons(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("schedule", "The race calendar for a season: rounds, circuit, locality and date.", {
        year: z.number().int().min(1950).max(2100).describe("Season, e.g. 2025"),
        limit: z.number().int().min(1).max(30).default(12).describe("Rounds to list")
    }, async (a) => {
        try {
            return text(await schedule(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("race_results", "Classification of one Grand Prix: position, driver, constructor, grid, laps and status.", {
        year: z.number().int().min(1950).max(2100).describe("Season, e.g. 2025"),
        round: z.number().int().min(1).max(30).describe("Round number in the season"),
        limit: z.number().int().min(1).max(30).default(10).describe("Classified drivers to show")
    }, async (a) => {
        try {
            return text(await raceResults(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("driver_standings", "Driver championship standings for a season, at the end or after a chosen round.", {
        year: z.number().int().min(1950).max(2100).describe("Season, e.g. 2025"),
        round: z.number().int().min(0).max(30).default(0).describe("Round number, 0 for the final standings"),
        limit: z.number().int().min(1).max(30).default(10).describe("Drivers to show")
    }, async (a) => {
        try {
            return text(await driverStandings(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
