import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { currentIntensity, generationMix, intensityForecast, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "carbon-intensity-mcp", version: "1.0.0" });
    server.tool("current_intensity", "Live carbon intensity for the UK grid with the published index band.", {
    // no arguments
    }, async (a) => {
        try {
            return text(await currentIntensity());
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("intensity_forecast", "Forecast intensity for the next few hours, in half-hour steps.", {
        hours: z.number().int().min(1).max(48).default(6).describe("How many hours ahead to forecast")
    }, async (a) => {
        try {
            return text(await intensityForecast(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("generation_mix", "Share of each fuel in the current UK generation mix.", {
    // no arguments
    }, async (a) => {
        try {
            return text(await generationMix());
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
