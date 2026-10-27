import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { describe, next, previousRuns, validate } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "cron-mcp", version: "1.0.0" });
    server.registerTool("describe", {
        title: "Describe",
        description: "Describe a cron expression in words.",
        inputSchema: z.object({ expression: z.string().describe("5 field cron expression.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await describe(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("next", {
        title: "Next",
        description: "Next run times for a cron expression.",
        inputSchema: z.object({ expression: z.string().describe("5 field cron expression."), count: z.number().describe("Number of runs.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await next(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("previous_runs", {
        title: "Previous runs",
        description: "The N times a cron expression already fired, counting backwards from now or from a reference instant, which is how you check whether a job has been running.",
        inputSchema: z.object({ expression: z.string().describe("5 field cron expression, e.g. */5 * * * *"), before: z.string().describe("Count backwards from this instant, e.g. 2026-09-27T00:00:00Z.").optional(), count: z.number().describe("How many past runs.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await previousRuns(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("validate", {
        title: "Validate",
        description: "Check whether a cron expression parses, reporting the parse error and the field count when it does not, and the next three runs when it does.",
        inputSchema: z.object({ expression: z.string().describe("Cron expression to check."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await validate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("schedule_holidays", {
        title: "Schedule holidays",
        description: "Look up national and regional public holidays from Nager.Date for planning cron exclusions. Defaults to the current year and US; regional records are explicitly marked.",
        inputSchema: z.object({ country: z.string().length(2).optional(), year: z.number().int().min(1970).max(2100).optional(), limit: z.number().int().min(1).max(50).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement holidays locally (paywall removed)
        try {
            return textError("Not yet implemented: holidays");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("solar_schedule", {
        title: "Solar schedule",
        description: "Fetch sunrise, sunset, solar noon and civil twilight UTC times for scheduling daylight tasks. Defaults to New York City today; source Sunrise-Sunset.org.",
        inputSchema: z.object({ latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), date: z.string().max(10).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement schedule locally (paywall removed)
        try {
            return textError("Not yet implemented: schedule");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "cron-mcp";
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
    return server;
}
