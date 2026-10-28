import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { crossings_by_state, crossing_detail, bridges_by_state, bridge_search, rail_summary, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "rail-infrastructure-mcp", version: "1.0.0" });
    server.tool("crossings_by_state", "Highway-rail grade crossings in a US state", {
        state: z.string().length(2).describe("Two-letter state code, e.g. TX"),
        limit: z.number().int().min(1).max(50).default(15).describe("Crossings to return")
    }, async (a) => {
        try {
            return text(await crossings_by_state(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("crossing_detail", "One highway-rail crossing by USDOT crossing id", {
        crossingId: z.string().min(6).describe("Crossing id, e.g. 755804A")
    }, async (a) => {
        try {
            return text(await crossing_detail(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("bridges_by_state", "Railroad bridges in a US state", {
        state: z.string().length(2).describe("Two-letter state code, e.g. IA"),
        limit: z.number().int().min(1).max(50).default(15).describe("Bridges to return")
    }, async (a) => {
        try {
            return text(await bridges_by_state(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("bridge_search", "Search railroad bridges by name, owner or waterway", {
        query: z.string().min(2).describe("Name or owner text, e.g. Mississippi or UP"),
        limit: z.number().int().min(1).max(50).default(15).describe("Bridges to return")
    }, async (a) => {
        try {
            return text(await bridge_search(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("rail_summary", "Crossing and bridge counts for a state", {
        state: z.string().length(2).describe("Two-letter state code")
    }, async (a) => {
        try {
            return text(await rail_summary(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
