import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BreweryError, TYPES, breweryDetail, byCity, byCountry, byState, byType, randomBreweries, searchBreweries, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof BreweryError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "openbrewerydb-mcp", version: "1.0.0" });
    const limit = z.number().int().min(1).max(50).default(10).describe("Breweries to return (1-50)");
    server.tool("search_breweries", "Free-text search over 8,000+ breweries worldwide.", { query: z.string().min(2).describe("Brewery name or part of it, e.g. 'dogfish'"), limit }, async ({ query, limit: n }) => {
        try {
            return text(await searchBreweries(query, n));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("breweries_by_state", "Breweries in one US state, full name or two-letter code.", { state: z.string().min(2).describe("State name or code, e.g. 'California' or 'CA'"), limit }, async ({ state, limit: n }) => {
        try {
            return text(await byState(state, n));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("breweries_by_city", "Breweries in one city.", { city: z.string().min(2).describe("City name, e.g. 'portland'"), limit }, async ({ city, limit: n }) => {
        try {
            return text(await byCity(city, n));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("breweries_by_type", "Breweries of one type: micro, nano, regional, brewpub, large, planning, bar, contract, proprietor or closed.", { type: z.enum(TYPES).describe("Brewery type"), limit }, async ({ type, limit: n }) => {
        try {
            return text(await byType(type, n));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("breweries_by_country", "Breweries in one country, spelled out, e.g. 'United States' or 'Ireland'.", { country: z.string().min(2).describe("Country name"), limit }, async ({ country, limit: n }) => {
        try {
            return text(await byCountry(country, n));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("brewery_detail", "One brewery with address, phone, website and an OpenStreetMap link.", { id: z.string().min(8).describe("Brewery id from any list tool") }, async ({ id }) => {
        try {
            return text(await breweryDetail(id));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("random_breweries", "A random handful of breweries, handy for discovery.", { size: z.number().int().min(1).max(25).default(5).describe("How many (1-25)") }, async ({ size }) => {
        try {
            return text(await randomBreweries(size));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
