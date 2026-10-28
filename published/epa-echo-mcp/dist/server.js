import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { facilities_in_state, facilities_by_zip, facilities_by_city, facilities_by_name, facility_detail, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "epa-echo-mcp", version: "1.0.0" });
    server.tool("facilities_in_state", "Regulated facilities in a US state, with compliance status", {
        state: z.string().length(2).describe("Two letter state code, e.g. RI"),
        activeOnly: z.boolean().default(true).describe("Only currently active facilities"),
        limit: z.number().int().min(1).max(100).default(25).describe("Maximum facilities")
    }, async (a) => {
        try {
            return text(await facilities_in_state(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("facilities_by_zip", "Regulated facilities in one US ZIP code", {
        zip: z.string().regex(/^\d{5}$/).describe("Five digit ZIP code"),
        limit: z.number().int().min(1).max(100).default(25).describe("Maximum facilities")
    }, async (a) => {
        try {
            return text(await facilities_by_zip(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("facilities_by_city", "Regulated facilities in one city", {
        city: z.string().min(2).describe("City name, e.g. Warwick"),
        state: z.string().length(2).describe("Two letter state code"),
        limit: z.number().int().min(1).max(100).default(25).describe("Maximum facilities")
    }, async (a) => {
        try {
            return text(await facilities_by_city(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("facilities_by_name", "Search facilities by name fragment", {
        name: z.string().min(2).describe("Facility name fragment"),
        state: z.string().length(2).optional().describe("Optional two letter state code"),
        limit: z.number().int().min(1).max(100).default(25).describe("Maximum facilities")
    }, async (a) => {
        try {
            return text(await facilities_by_name(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("facility_detail", "Full ECHO record for one facility by registry id", {
        registryId: z.string().min(6).describe("ECHO registry id, e.g. 110058931018")
    }, async (a) => {
        try {
            return text(await facility_detail(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
