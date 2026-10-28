import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ALERT_LEVELS, GdacsError, TYPE_CODES, activeByType, alertSummary, currentEvents, eventDetail, typeCatalog } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof GdacsError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
const TYPE_CODES_T = TYPE_CODES;
export function createServer() {
    const server = new McpServer({ name: "gdacs-mcp", version: "1.0.0" });
    server.tool("current_alerts", "Live disaster alerts from GDACS across earthquakes, cyclones, floods, volcanoes, wildfires and droughts.", {
        types: z.array(z.enum(TYPE_CODES_T)).optional().describe("Limit to these hazard types (default all six)"),
        levels: z.array(z.enum(ALERT_LEVELS)).optional().describe("Limit to these alert levels"),
        limit: z.number().int().min(1).max(50).default(15).describe("Events to show (1-50)"),
    }, async ({ types, levels, limit }) => {
        try {
            return text(await currentEvents({ types, levels, limit }));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("alerts_by_type", "Every current event of one hazard type, e.g. only wildfires.", {
        type: z.enum(TYPE_CODES_T).describe("EQ, TC, FL, VO, WF or DR"),
        limit: z.number().int().min(1).max(50).default(15).describe("Events to show (1-50)"),
    }, async ({ type, limit }) => {
        try {
            return text(await activeByType(type, limit));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("alert_summary", "How many events GDACS is tracking right now, by level and hazard, plus the most severe one.", {}, async () => {
        try {
            return text(await alertSummary());
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("event_detail", "One GDACS event with severity numbers and the official report link.", {
        eventId: z.number().int().positive().describe("Event id from any list tool"),
        eventType: z.enum(TYPE_CODES_T).describe("Hazard code, e.g. EQ"),
    }, async ({ eventId, eventType }) => {
        try {
            return text(await eventDetail(eventId, eventType));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("hazard_types", "The hazard types and alert levels GDACS uses.", {}, async () => {
        try {
            return text(await typeCatalog());
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
