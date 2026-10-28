import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { current_intensity, generation_mix, intensity_history, intensity_for_date, regional_intensity, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "grid-carbon-mcp", version: "1.0.0" });
    server.tool("current_intensity", "Current UK electricity carbon intensity", {
    // no arguments
    }, async (a) => {
        try {
            return text(await current_intensity(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("generation_mix", "Current UK generation mix by fuel", {
    // no arguments
    }, async (a) => {
        try {
            return text(await generation_mix(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("intensity_history", "Half-hourly carbon intensity between two timestamps", {
        from: z.string().min(10).describe("Start, e.g. 2026-10-27T00:00Z"),
        to: z.string().min(10).describe("End, e.g. 2026-10-27T06:00Z")
    }, async (a) => {
        try {
            return text(await intensity_history(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("intensity_for_date", "Carbon intensity for a whole day", {
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Date YYYY-MM-DD")
    }, async (a) => {
        try {
            return text(await intensity_for_date(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("regional_intensity", "Carbon intensity by UK region", {
    // no arguments
    }, async (a) => {
        try {
            return text(await regional_intensity(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
