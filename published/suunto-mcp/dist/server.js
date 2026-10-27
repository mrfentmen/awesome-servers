import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listWorkouts, getWorkout, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "suunto-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_workouts", {
        title: "List workouts",
        description: "Recent Suunto workouts: sport, duration, distance, heart rate, start time.",
        inputSchema: z.object({
            limit: z.number().default(10).describe("How many workouts"),
            offset: z.number().default(0).describe("Paging offset"),
        }),
        annotations: READ_ONLY,
    }, async ({ limit, offset }) => {
        try {
            return text(await listWorkouts(limit, offset));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_workout", {
        title: "Get workout detail",
        description: "One Suunto workout summary: samples metadata, laps, zones, totals.",
        inputSchema: z.object({
            workoutId: z.string().describe("Workout id from list_workouts"),
        }),
        annotations: READ_ONLY,
    }, async ({ workoutId }) => {
        try {
            return text(await getWorkout(workoutId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "suunto-mcp";
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
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    server.registerTool("status", {
        title: "Status",
        description: "Get server status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("Server is running normally.");
    });
    return server;
}
