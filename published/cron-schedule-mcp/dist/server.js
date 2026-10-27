import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { describeCron, nextRuns, parseCron, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "cron-schedule-mcp", version: "1.0.0" });
    server.tool("describe_cron", "Explain a cron expression in plain words.", {
        expression: z.string().min(5).describe("Five-field cron expression, e.g. */15 9-17 * * 1-5")
    }, async (a) => {
        try {
            return text(await describeCron(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("next_runs", "Upcoming run times for a cron expression, in ISO local time.", {
        expression: z.string().min(5).describe("Five-field cron expression"),
        count: z.number().int().min(1).max(20).default(5).describe("Run times to list"),
        from: z.string().optional().describe("Start time as ISO 8601, e.g. 2026-11-01T00:00:00Z. Defaults to now")
    }, async (a) => {
        try {
            return text(await nextRuns(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("parse_cron", "Expand each cron field into the exact values it matches.", {
        expression: z.string().min(5).describe("Five-field cron expression")
    }, async (a) => {
        try {
            return text(await parseCron(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
