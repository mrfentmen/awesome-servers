import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { water_system, search_systems, violations, enforcement, systems_by_type, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "drinking-water-mcp", version: "1.0.0" });
    server.tool("water_system", "One public water system by PWSID", {
        pwsid: z.string().min(5).describe("PWSID, e.g. RI4100001")
    }, async (a) => {
        try {
            return text(await water_system(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("search_systems", "Search public water systems in a state by name", {
        state: z.string().length(2).describe("Two letter state code, e.g. RI"),
        name: z.string().min(2).optional().describe("Optional name fragment"),
        limit: z.number().int().min(1).max(50).default(15).describe("Maximum systems")
    }, async (a) => {
        try {
            return text(await search_systems(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("violations", "Drinking water violations recorded for a system", {
        pwsid: z.string().min(5).describe("PWSID"),
        limit: z.number().int().min(1).max(50).default(20).describe("Maximum violations")
    }, async (a) => {
        try {
            return text(await violations(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("enforcement", "Enforcement actions recorded for a system", {
        pwsid: z.string().min(5).describe("PWSID"),
        limit: z.number().int().min(1).max(50).default(20).describe("Maximum actions")
    }, async (a) => {
        try {
            return text(await enforcement(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("systems_by_type", "Active water systems of one type in a state", {
        state: z.string().length(2).describe("Two letter state code"),
        systemType: z.enum(["CWS", "NTNCWS", "TNCWS"]).describe("CWS community, NTNCWS non-transient non-community, TNCWS transient non-community"),
        limit: z.number().int().min(1).max(50).default(15).describe("Maximum systems")
    }, async (a) => {
        try {
            return text(await systems_by_type(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
