import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listEventTypes, listBookings, listSchedules, eventType, booking, schedule, teams, teamDetails, webhooks, me, openSlots, slotDensity, publicEventTypes } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "calcom-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_event_types", {
        title: "Event types",
        description: "Scheduling links people can book, with duration.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listEventTypes());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_bookings", {
        title: "Bookings",
        description: "Upcoming bookings with attendee and start time.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listBookings());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_schedules", {
        title: "Schedules",
        description: "Availability schedules and their timezones.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listSchedules());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("event_type", {
        title: "Event type",
        description: "Single event type.",
        inputSchema: z.object({
            type_id: z.string().describe("Event type ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ type_id }) => {
        try {
            return text(await eventType(type_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("booking", {
        title: "Booking",
        description: "Booking by UID.",
        inputSchema: z.object({
            uid: z.string().describe("Booking UID.")
        }),
        annotations: READ_ONLY,
    }, async ({ uid }) => {
        try {
            return text(await booking(uid));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("schedule", {
        title: "Schedule",
        description: "Schedule by ID.",
        inputSchema: z.object({
            schedule_id: z.string().describe("Schedule ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ schedule_id }) => {
        try {
            return text(await schedule(schedule_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("teams", {
        title: "Teams",
        description: "All teams.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await teams());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("team_details", {
        title: "Team details",
        description: "Single team.",
        inputSchema: z.object({
            team_id: z.string().describe("Team ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ team_id }) => {
        try {
            return text(await teamDetails(team_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("webhooks", {
        title: "Webhooks",
        description: "Registered webhooks.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await webhooks());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("me", {
        title: "My profile",
        description: "Authenticated user.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await me());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("open_slots", {
        title: "Open slots",
        description: "Every free booking slot Cal.com publishes for one event type between two dates, with a per-day count. Uses the public slots endpoint, so it needs no API key.",
        inputSchema: z.object({
            event_type_id: z.string().describe("Numeric Cal.com event type id"),
            start_date: z.string().describe("Start date, YYYY-MM-DD"),
            end_date: z.string().describe("End date, YYYY-MM-DD, up to 60 days after the start"),
            time_zone: z.string().describe("IANA time zone, e.g. Europe/Berlin. Defaults to UTC.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await openSlots(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("slot_density", {
        title: "Slot density",
        description: "How open a Cal.com event type is: quietest and busiest day, average slots per open day by weekday, and a per-day bar for the range. Public endpoint, no API key needed.",
        inputSchema: z.object({
            event_type_id: z.string().describe("Numeric Cal.com event type id"),
            start_date: z.string().describe("Start date, YYYY-MM-DD"),
            end_date: z.string().describe("End date, YYYY-MM-DD, up to 60 days after the start"),
            time_zone: z.string().describe("IANA time zone, e.g. Europe/Berlin. Defaults to UTC.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await slotDensity(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("public_event_types", {
        title: "Public event types",
        description: "A Cal.com user's public booking pages with length, buffers, notice, seat limits and price. Public endpoint, no API key needed.",
        inputSchema: z.object({
            username: z.string().describe("Cal.com username, e.g. john"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await publicEventTypes(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    return server;
}
