import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { currentPosition, IssError, listSatellites, overheadCheck, positionTrack, satelliteTle, visibilityReport, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof IssError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
const satArg = z.number().int().min(1).max(999999).default(25544).describe("NORAD id (25544 is the ISS)");
export function createServer() {
    const server = new McpServer({ name: "iss-tracker-mcp", version: "1.0.0" });
    server.tool("current_position", "Where the ISS (or another tracked satellite) is right now: coordinates, altitude, speed, sunlit or dark.", { satellite_id: satArg }, async ({ satellite_id }) => {
        try {
            return text(await currentPosition(satellite_id));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("position_track", "Recent ground track: a series of positions over the past N minutes.", {
        satellite_id: satArg,
        minutes: z.number().int().min(5).max(720).default(45).describe("How far back to sample, in minutes"),
        points: z.number().int().min(2).max(10).default(6).describe("Number of samples (max 10)"),
    }, async ({ satellite_id, minutes, points }) => {
        try {
            return text(await positionTrack(satellite_id, minutes, points));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("visibility_report", "Whether the ISS will be in sunlight over the next hours, with daylight/eclipse transitions.", {
        satellite_id: satArg,
        hours: z.number().int().min(1).max(24).default(3).describe("Forecast horizon in hours"),
        points: z.number().int().min(2).max(10).default(10).describe("Number of forecast samples"),
    }, async ({ satellite_id, hours, points }) => {
        try {
            return text(await visibilityReport(satellite_id, hours, points));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("list_satellites", "Which satellites this tracking API currently covers.", {}, async () => {
        try {
            return text(await listSatellites());
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("satellite_tle", "Current orbital elements (TLE) so you can propagate passes yourself.", { satellite_id: satArg }, async ({ satellite_id }) => {
        try {
            return text(await satelliteTle(satellite_id));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("overhead_check", "Is the ISS above a given latitude/longitude right now? Distance to its sub-point and footprint coverage.", {
        satellite_id: satArg,
        latitude: z.number().min(-90).max(90).describe("Observer latitude, e.g. 40.71"),
        longitude: z.number().min(-180).max(180).describe("Observer longitude, e.g. -74.01"),
    }, async ({ satellite_id, latitude, longitude }) => {
        try {
            return text(await overheadCheck(satellite_id, latitude, longitude));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
