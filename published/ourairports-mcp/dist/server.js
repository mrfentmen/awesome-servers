import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { airportsNear, lookupAirport, searchAirports, SourceError, airportRunways, airportFrequencies, airportStats } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "ourairports-mcp", version: "1.0.2" });
    server.tool("lookup_airport", "Find an airport by IATA, ICAO or internal ident code.", {
        code: z.string().min(3).describe('IATA like "LHR", ICAO like "EGLL", or ident')
    }, async (a) => {
        try {
            return text(await lookupAirport(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("search_airports", "Search airports by name, city or code fragment.", {
        query: z.string().min(2).describe('Text such as "Heathrow" or "Tokyo"'),
        limit: z.number().int().min(1).max(30).default(10).describe("Results to return"),
        country: z.string().optional().describe("Optional ISO country code like GB")
    }, async (a) => {
        try {
            return text(await searchAirports(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("airports_near", "Airports within a radius of a latitude and longitude.", {
        latitude: z.number().min(-90).max(90).describe("Latitude"),
        longitude: z.number().min(-180).max(180).describe("Longitude"),
        radiusKm: z.number().positive().max(500).default(100).describe("Search radius in km"),
        limit: z.number().int().min(1).max(30).default(10).describe("Results to return")
    }, async (a) => {
        try {
            return text(await airportsNear(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("airport_runways", "Runways for an airport.", {
        code: z.string().min(3).describe("IATA, ICAO or ident code"),
        limit: z.number().int().min(1).max(20).default(6).describe("Runways to return")
    }, async (a) => {
        try {
            return text(await airportRunways(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("airport_frequencies", "Radio frequencies for an airport.", {
        code: z.string().min(3).describe("IATA, ICAO or ident code"),
        limit: z.number().int().min(1).max(30).default(10).describe("Frequencies to return")
    }, async (a) => {
        try {
            return text(await airportFrequencies(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("airport_stats", "Airport counts by type for a country or the world.", {
        country: z.string().length(2).optional().describe("Two-letter ISO country code, e.g. US")
    }, async (a) => {
        try {
            return text(await airportStats(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
