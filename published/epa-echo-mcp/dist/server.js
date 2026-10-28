import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { enforcementTotals, facilitySite, searchFacilities, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "epa-echo-mcp", version: "1.0.0" });
    server.tool("search_facilities", "Find EPA-regulated facilities in a state, optionally filtered to one city.", {
        state: z.string().length(2).describe('Two-letter state code, e.g. "RI"'),
        city: z.string().min(2).optional().describe('City name, e.g. "Providence"'),
        limit: z.number().int().min(1).max(50).default(15).describe("Facilities to return")
    }, async (a) => {
        try {
            return text(await searchFacilities(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("enforcement_totals", "Enforcement and compliance row counts and total penalties for a state's facilities.", {
        state: z.string().length(2).describe('Two-letter state code, e.g. "RI"')
    }, async (a) => {
        try {
            return text(await enforcementTotals(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("facility_site", "FRS facility site record (address, county, federal agency) by EPA registry ID.", {
        registryId: z.string().min(9).describe('EPA FRS registry ID, e.g. "110064359199"')
    }, async (a) => {
        try {
            return text(await facilitySite(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
