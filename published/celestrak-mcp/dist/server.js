import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { satellites_by_group, satellite_by_catnr, satellite_by_name, satcat_by_catnr, groups, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "celestrak-mcp", version: "1.0.0" });
    server.tool("satellites_by_group", "Satellites in a named CelesTrak group, with current orbital elements", {
        group: z.string().min(2).describe("Group name, e.g. stations, active, weather, gps-ops"),
        limit: z.number().int().min(1).max(100).default(20).describe("Maximum satellites")
    }, async (a) => {
        try {
            return text(await satellites_by_group(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("satellite_by_catnr", "Orbital elements for one satellite by NORAD catalogue number", {
        catnr: z.number().int().min(1).describe("NORAD catalogue number, e.g. 25544")
    }, async (a) => {
        try {
            return text(await satellite_by_catnr(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("satellite_by_name", "Find satellites by name", {
        name: z.string().min(2).describe("Name or part of it, e.g. ISS")
    }, async (a) => {
        try {
            return text(await satellite_by_name(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("satcat_by_catnr", "Catalogue entry for a satellite: launch date, orbit class and radar cross-section", {
        catnr: z.number().int().min(1).describe("NORAD catalogue number, e.g. 25544")
    }, async (a) => {
        try {
            return text(await satcat_by_catnr(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("groups", "List the satellite groups this server can fetch", {
    // no arguments
    }, async (a) => {
        try {
            return text(await groups(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
