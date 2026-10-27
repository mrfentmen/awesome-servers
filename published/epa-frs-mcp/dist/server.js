import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { byState, facility, programCount } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "epa-frs-mcp", version: "1.0.0" });
    server.registerTool("by_state", {
        title: "By state",
        description: "Facilities in a US state.",
        inputSchema: z.object({ state: z.string().describe("Two letter state code like VA."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await byState(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("facility", {
        title: "Facility",
        description: "One facility by registry ID.",
        inputSchema: z.object({ registryId: z.string().describe("FRS registry ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await facility(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("program_facility_count", {
        title: "Program facility count",
        description: "How many facility to programme registrations the EPA holds, for one state or for the whole country, counted by the service itself rather than from fetched rows.",
        inputSchema: z.object({ state: z.string().describe("Two letter state code like VA. Omit to count the whole country.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await programCount(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("program_facilities", {
        title: "Program facilities",
        description: "Facility to programme registrations in a state, with the programme name, its own programme id, the registry id and the site type. The by_state tool reads a different table and never says which programmes a facility belongs to.",
        inputSchema: z.object({ state: z.string().describe("Two letter state code like VA."), limit: z.number().describe("How many rows to fetch, 1 to 50.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement facilities locally (paywall removed)
        try {
            return textError("Not yet implemented: facilities");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "epa-frs-mcp";
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
