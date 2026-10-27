import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatLight, LifxError, listLights, setPower, kelvinSchedule } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const WRITE = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "lifx-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_lights", {
        title: "List lights",
        description: "LIFX lights with power, brightness, color, online state.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const rows = await listLights();
            if (rows.length === 0)
                return text("No lights.");
            return text(rows.map((l, i) => formatLight(l, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("set_power", {
        title: "Set power",
        description: "Turn LIFX lights on or off with brightness.",
        inputSchema: z.object({
            selector: z.string().describe("Selector: 'all', 'label:Desk', 'group:Living Room', or light id"),
            power: z.enum(["on", "off", "toggle"]).default("toggle"),
            brightness: z.number().min(0).max(1).default(1).describe("0 (dim) to 1 (full)"),
        }),
        annotations: WRITE,
    }, async ({ selector, power, brightness }) => {
        try {
            return text(await setPower(selector, power, brightness));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("color_convert", {
        title: "Convert a LIFX colour",
        description: "Convert between colour temperature, hex, HSL and LIFX HSBK. Gives the exact set_state payload a LIFX bulb expects, plus the estimated colour temperature of the colour you supplied. Runs entirely on this machine, no bulb or token needed.",
        inputSchema: z.object({
            kelvin: z.number().optional().describe("Colour temperature in kelvin, e.g. 2700"),
            hex: z.string().optional().describe("Hex colour, e.g. #FF8800"),
            hue: z.number().optional().describe("Hue 0-360"),
            saturation: z.number().optional().describe("Saturation 0-1"),
            brightness: z.number().min(0).max(1).optional().describe("Brightness 0-1, default 1"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement convert locally (paywall removed)
        try {
            return textError("Not yet implemented: convert");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("kelvin_schedule", {
        title: "Plan a colour temperature schedule",
        description: "Interpolate a colour temperature and brightness curve across the day from a few keyframes, rendered as the exact LIFX payloads with the colour each step looks like. Local, no bulb needed.",
        inputSchema: z.object({
            keyframes: z.array(z.object({
                at: z.string().describe("Time of day as HH:MM"),
                kelvin: z.number().describe("Colour temperature at that time"),
                brightness: z.number().describe("Brightness 0-1 at that time"),
            })).describe("At least two keyframes, in any order"),
            start: z.string().optional().describe("Start time HH:MM, default the first keyframe"),
            end: z.string().optional().describe("End time HH:MM, default 24 h after the start"),
            step_minutes: z.number().int().min(5).max(720).default(60).describe("Rows per hour of curve, default 60"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await kelvinSchedule(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "lifx-mcp";
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
function errorMessage(e) {
    if (e instanceof LifxError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
