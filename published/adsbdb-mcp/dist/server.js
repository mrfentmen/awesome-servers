import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { aircraftByHex, flightRoute, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "adsbdb-mcp", version: "1.0.0" });
    server.tool("flight_route", "Airline, origin and destination for a callsign.", {
        callsign: z.string().min(2).describe('Callsign, e.g. "DLH123"')
    }, async (a) => {
        try {
            return text(await flightRoute(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("aircraft_by_hex", "Airframe details from a 24-bit ICAO hex code.", {
        hex: z.string().regex(/^[0-9a-fA-F]{6}$/).describe("ICAO hex code")
    }, async (a) => {
        try {
            return text(await aircraftByHex(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
