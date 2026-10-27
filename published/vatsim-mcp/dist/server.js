import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { controllers, pilots, serverList } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "vatsim-mcp", version: "1.0.0" });
    server.registerTool("pilots", {
        title: "Pilots",
        description: "Connected pilots.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await pilots(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("controllers", {
        title: "Controllers",
        description: "Connected ATC controllers.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await controllers(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("atis", {
        title: "Atis",
        description: "Live VATSIM ATIS stations: frequency, facility, station name, the current text ATIS and when it was last updated.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(40).default(10), frequency: z.string().max(10).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement atis locally (paywall removed)
        try {
            return textError("Not yet implemented: atis");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("servers", {
        title: "Servers",
        description: "The VATSIM server list with location and whether it accepts client connections, plus network-wide connected client and unique user counts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await serverList(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("pilot_detail", {
        title: "Pilot detail",
        description: "One connected pilot by callsign or CID: live position, altitude, speed, heading, transponder, QNH, flight plan and route.",
        inputSchema: z.object({ callsign: z.string().max(20).optional(), cid: z.number().int().min(1).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement detail locally (paywall removed)
        try {
            return textError("Not yet implemented: detail");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "vatsim-mcp";
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
