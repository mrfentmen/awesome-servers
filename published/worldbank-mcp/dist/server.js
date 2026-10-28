import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { compareCountries, countryInfo, indicatorInfo, indicatorSeries, latestValue, searchIndicators, WorldBankError, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof WorldBankError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
const countryArg = z.string().min(2).describe("ISO3 code, e.g. USA");
const indicatorArg = z.string().min(2).describe("Indicator code, e.g. SP.POP.TOTL (use search_indicators to find one)");
export function createServer() {
    const server = new McpServer({ name: "@mrfentmen/worldbank-mcp", version: "1.0.4" });
    server.tool("search_indicators", "Find a World Bank indicator code by name — searches the whole catalogue (about 29,000 codes).", {
        query: z.string().min(2).describe("Words from the indicator name, e.g. population"),
        limit: z.number().int().min(1).max(40).default(15).describe("Results"),
    }, async ({ query, limit }) => {
        try {
            return text(await searchIndicators(query, limit));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("indicator_info", "Name, unit, source and description for one indicator code.", { indicator: indicatorArg }, async ({ indicator }) => {
        try {
            return text(await indicatorInfo(indicator));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("country_info", "Region, income level and capital for a country code.", { country: countryArg }, async ({ country }) => {
        try {
            return text(await countryInfo(country));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("indicator_series", "Year-by-year values for one indicator in one country.", {
        country: countryArg,
        indicator: indicatorArg,
        from_year: z.number().int().min(1960).max(2100).default(2010).describe("First year"),
        to_year: z.number().int().min(1960).max(2100).default(2025).describe("Last year"),
    }, async ({ country, indicator, from_year, to_year }) => {
        try {
            return text(await indicatorSeries(country, indicator, from_year, to_year));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("compare_countries", "One indicator for several countries in the same year, ranked highest first.", {
        countries: z.string().min(2).describe("Country codes separated by semicolons, e.g. USA;CHN;IND"),
        indicator: indicatorArg,
        year: z.number().int().min(1960).max(2100).describe("Year to compare"),
    }, async ({ countries, indicator, year }) => {
        try {
            return text(await compareCountries(countries, indicator, year));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("latest_value", "The most recent reported value for an indicator in one country.", { country: countryArg, indicator: indicatorArg }, async ({ country, indicator }) => {
        try {
            return text(await latestValue(country, indicator));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
