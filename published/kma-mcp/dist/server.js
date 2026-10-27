import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getForecast, getUltrashort, getObservations, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "kma-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_forecast", {
        title: "Get village forecast",
        description: "KMA 3-day village forecast: temp, rain probability, sky, wind, humidity. Defaults to latest release and Seoul grid.",
        inputSchema: z.object({
            nx: z.number().default(60).describe("Grid X (Seoul 60)"),
            ny: z.number().default(127).describe("Grid Y (Seoul 127)"),
            baseDate: z.string().optional().describe("Base date YYYYMMDD, default latest"),
            baseTime: z.string().optional().describe("Base time HHMM, default latest"),
        }),
        annotations: READ_ONLY,
    }, async ({ nx, ny, baseDate, baseTime }) => {
        try {
            return text(await getForecast(nx, ny, baseDate, baseTime));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_ultrashort", {
        title: "Get ultra-short forecast",
        description: "KMA 6-hour ultra-short forecast for a grid point, updated every 30 minutes.",
        inputSchema: z.object({
            nx: z.number().default(60).describe("Grid X"),
            ny: z.number().default(127).describe("Grid Y"),
        }),
        annotations: READ_ONLY,
    }, async ({ nx, ny }) => {
        try {
            return text(await getUltrashort(nx, ny));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_observations", {
        title: "Get ultra-short observations",
        description: "Latest KMA observations for a grid point: temp, rain, humidity, wind.",
        inputSchema: z.object({
            nx: z.number().default(60).describe("Grid X"),
            ny: z.number().default(127).describe("Grid Y"),
        }),
        annotations: READ_ONLY,
    }, async ({ nx, ny }) => {
        try {
            return text(await getObservations(nx, ny));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "kma-mcp";
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
