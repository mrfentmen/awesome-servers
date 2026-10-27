import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createEvent, createReminder } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const WRITE = { readOnlyHint: false, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "ics-generator-mcp", version: "1.0.0" });
    server.registerTool("create_event", {
        title: "Create event",
        description: "Create an ics calendar event from a title, dates, and details.",
        inputSchema: z.object({ title: z.string().describe("Event title."), start: z.string().describe("Start time in ISO format."), end: z.string().describe("End time in ISO format.").optional(), description: z.string().describe("Event description.").optional(), location: z.string().describe("Event location.").optional(), filename: z.string().describe("Output file name.").optional() }),
        annotations: WRITE,
    }, async (args) => {
        try {
            return text(await createEvent(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("create_reminder", {
        title: "Create reminder",
        description: "Create an all day reminder event from a date.",
        inputSchema: z.object({ title: z.string().describe("Reminder title."), date: z.string().describe("Date in YYYY-MM-DD format.") }),
        annotations: WRITE,
    }, async (args) => {
        try {
            return text(await createReminder(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("create_holiday_calendar", {
        title: "Create holiday calendar",
        description: "Write an ics file of every public holiday a country observes in a year, using the Nager.Date holiday service.",
        inputSchema: z.object({
            country: z.string().describe("Two letter ISO country code, for example GB or US."),
            year: z.number().describe("Year, defaults to this year.").optional(),
            limit: z.number().describe("Max holidays to write, 1-400, default 60.").optional(),
            filename: z.string().describe("Output file name.").optional(),
        }),
        annotations: WRITE,
    }, async (args) => {
        // TODO: implement calendar locally (paywall removed)
        try {
            return textError("Not yet implemented: calendar");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("create_sun_calendar", {
        title: "Create sunrise and sunset calendar",
        description: "Write an ics file of sunrise and sunset times in UTC for a coordinate over the next few days, using the Open-Meteo forecast service.",
        inputSchema: z.object({
            latitude: z.number().describe("Latitude between -90 and 90."),
            longitude: z.number().describe("Longitude between -180 and 180."),
            days: z.number().describe("Days to cover, 1-31, default 7.").optional(),
            filename: z.string().describe("Output file name.").optional(),
        }),
        annotations: WRITE,
    }, async (args) => {
        // TODO: implement calendar locally (paywall removed)
        try {
            return textError("Not yet implemented: calendar");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ics-generator-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    server.registerTool("timestamp", {
        title: "Timestamp",
        description: "Get the current UTC timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(new Date().toISOString());
    });
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
