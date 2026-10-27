import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listDevices, getDeviceStatus, sendCommand, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "switchbot-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_devices", {
        title: "List devices",
        description: "All SwitchBot devices: bots, curtains, meters, plugs, locks, cameras with ids and types.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listDevices());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_device_status", {
        title: "Get device status",
        description: "Live SwitchBot device status: temperature, humidity, battery, on/off, position.",
        inputSchema: z.object({
            deviceId: z.string().describe("Device id from list_devices"),
        }),
        annotations: READ_ONLY,
    }, async ({ deviceId }) => {
        try {
            return text(await getDeviceStatus(deviceId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("send_command", {
        title: "Send device command",
        description: "Control a SwitchBot device: turnOn/turnOff, press, setPosition, setBrightness and more.",
        inputSchema: z.object({
            deviceId: z.string().describe("Device id"),
            command: z.string().describe("Command, e.g. 'turnOn', 'press'"),
            parameter: z.string().default("default").describe("Command parameter"),
            commandType: z.string().default("command").describe("Usually 'command'"),
        }),
        annotations: NON_READ_ONLY,
    }, async ({ deviceId, command, parameter, commandType }) => {
        try {
            return text(await sendCommand(deviceId, command, parameter, commandType));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "switchbot-mcp";
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
    return server;
}
