import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { latestObservation, recentObservations, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "ndbc-mcp", version: "1.0.1" });
    server.tool("latest_observation", "Most recent observation from a buoy or coastal station.", {
        station: z.string().min(4).max(6).describe('Station id, e.g. "41010" or "44025"')
    }, async (a) => {
        try {
            return text(await latestObservation(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("recent_observations", "Recent rows from a station's feed, newest first.", {
        station: z.string().min(4).max(6).describe("Station id"),
        rows: z.number().int().min(1).max(48).default(6).describe("How many recent rows to return")
    }, async (a) => {
        try {
            return text(await recentObservations(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
