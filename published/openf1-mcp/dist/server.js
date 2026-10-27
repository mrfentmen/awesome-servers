import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { drivers, races } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "openf1-mcp", version: "1.0.0" });
    server.registerTool("races", {
        title: "Races",
        description: "List races for a season.",
        inputSchema: z.object({ year: z.number().describe("Season year.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await races(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("drivers", {
        title: "Drivers",
        description: "List drivers for a session.",
        inputSchema: z.object({ session: z.number().describe("Session key.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await drivers(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("session_list", {
        title: "Session list",
        description: "List the sessions in an F1 race weekend from OpenF1: practice, qualifying and race, with session keys, start and end times, circuit and cancelled flag.",
        inputSchema: z.object({ meeting_key: z.number().describe("Race weekend key, from the races tool."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement list locally (paywall removed)
        try {
            return textError("Not yet implemented: list");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("tyre_stints", {
        title: "Tyre stints",
        description: "Tyre stints in an OpenF1 session: compound, stint number, lap range and starting tyre age, per driver.",
        inputSchema: z.object({ session: z.number().describe("Session key, from session_list."), driver_number: z.number().describe("Limit to one driver number.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement stints locally (paywall removed)
        try {
            return textError("Not yet implemented: stints");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("fastest_laps", {
        title: "Fastest laps",
        description: "Each driver's fastest lap in an OpenF1 session, with sector times and top speed.",
        inputSchema: z.object({ session: z.number().describe("Session key, from session_list."), limit: z.number().describe("Max drivers, 1-25, default 10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement laps locally (paywall removed)
        try {
            return textError("Not yet implemented: laps");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "openf1-mcp";
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
    return server;
}
