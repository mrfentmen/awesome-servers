import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { discoveryStats, ExoplanetError, habitableCandidates, planetDetail, recentDiscoveries, searchPlanets, systemPlanets, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof ExoplanetError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "exoplanet-mcp", version: "1.0.0" });
    server.tool("search_planets", "Search confirmed exoplanets by planet or host-star name fragment in the NASA Exoplanet Archive.", {
        query: z.string().min(1).describe("Name fragment, e.g. trappist or kepler-16"),
        limit: z.number().int().min(1).max(50).default(10).describe("Results"),
    }, async ({ query, limit }) => {
        try {
            return text(await searchPlanets(query, limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("planet_detail", "Full physical and orbital parameters for one named planet.", { name: z.string().min(2).describe("Exact planet name, e.g. GJ 436 b") }, async ({ name }) => {
        try {
            return text(await planetDetail(name));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("system_planets", "Every confirmed planet around one host star, ordered by distance from the star.", { hostname: z.string().min(1).describe("Host star, e.g. TRAPPIST-1") }, async ({ hostname }) => {
        try {
            return text(await systemPlanets(hostname));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("recent_discoveries", "Most recently confirmed planets from a starting year.", {
        from_year: z.number().int().min(1992).max(2100).describe("Earliest discovery year"),
        limit: z.number().int().min(1).max(50).default(15).describe("Results"),
    }, async ({ from_year, limit }) => {
        try {
            return text(await recentDiscoveries(from_year, limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("habitable_candidates", "Small planets with equilibrium temperatures between 180 and 310 K — a rough habitable-zone filter.", { limit: z.number().int().min(1).max(50).default(15).describe("Results") }, async ({ limit }) => {
        try {
            return text(await habitableCandidates(limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("discovery_stats", "Confirmed-planet counts per discovery year since a starting year.", { from_year: z.number().int().min(1992).max(2100).default(2010).describe("Earliest year to include") }, async ({ from_year }) => {
        try {
            return text(await discoveryStats(from_year));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
