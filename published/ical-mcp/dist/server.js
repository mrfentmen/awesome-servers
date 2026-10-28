import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createEvent, parseIcal, validateIcal, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "ical-mcp", version: "1.0.0" });
    server.tool("parse_ical", "Parse an .ics document: calendar headers and each event's start, end, place, attendees and repeat rule.", {
        text: z.string().describe('Raw iCalendar text'), limit: z.number().int().min(1).max(50).optional().describe('Events to show, default 10')
    }, async (a) => {
        try {
            return text(await parseIcal(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("create_event", "Build a valid single-event calendar from ISO 8601 dates, with proper escaping and RFC 5545 line folding.", {
        summary: z.string().describe('Event title'), start: z.string().describe('ISO 8601 start, e.g. 2026-11-01T10:00:00Z'), end: z.string().optional().describe('ISO 8601 end, default start + 1 hour'), location: z.string().optional().describe('Where it happens'), description: z.string().optional().describe('Longer notes'), uid: z.string().optional().describe('UID to use, default a random one')
    }, async (a) => {
        try {
            return text(await createEvent(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("validate_ical", "Check an .ics document for structural problems: unbalanced components, missing properties, line endings.", {
        text: z.string().describe('Raw iCalendar text')
    }, async (a) => {
        try {
            return text(await validateIcal(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
