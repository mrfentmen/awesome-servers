import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lookupPostcode, lookupPostcodes, supportedCountries, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "zippopotam-mcp", version: "1.0.1" });
    server.tool("lookup_postcode", "Places behind one postal code, with coordinates.", {
        country: z.string().length(2).describe("Two-letter country code, e.g. us, de, jp"),
        postcode: z.string().min(2).max(12).describe("Postal code, e.g. 90210 or SW1A")
    }, async (a) => {
        try {
            return text(await lookupPostcode(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("lookup_postcodes", "Look up several postal codes in one country at once.", {
        country: z.string().length(2).describe("Two-letter country code"),
        postcodes: z.array(z.string().min(2).max(12)).min(2).max(10).describe("Up to 10 postal codes")
    }, async (a) => {
        try {
            return text(await lookupPostcodes(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("supported_countries", "The country codes this service can look postal codes up in.", {
    // no arguments
    }, async (a) => {
        try {
            return text(await supportedCountries());
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
