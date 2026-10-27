import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getInfo, getState, setPower, getEffects, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "nanoleaf-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_info", {
        title: "Get panel info",
        description: "Nanoleaf model, firmware, layout and current state snapshot.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getInfo());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_state", {
        title: "Get power state",
        description: "Nanoleaf on/off, brightness, hue, saturation, color temperature.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getState());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("set_power", {
        title: "Set power",
        description: "Turn Nanoleaf panels on or off.",
        inputSchema: z.object({
            on: z.boolean().describe("True for on, false for off"),
        }),
        annotations: NON_READ_ONLY,
    }, async ({ on }) => {
        try {
            return text(await setPower(on));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_effects", {
        title: "Get effects",
        description: "Nanoleaf installed effects and the active one.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getEffects());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "nanoleaf-mcp";
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
