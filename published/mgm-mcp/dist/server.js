import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listProvinces, listDistricts, getDaily, getHourly } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "mgm-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_provinces", {
        title: "List provinces",
        description: "All Turkish provinces with center ids from MGM.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listProvinces());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_districts", {
        title: "List districts",
        description: "Districts of a province with station ids for forecasts (gunlukTahminIstNo) and current conditions (sondurumIstNo).",
        inputSchema: z.object({
            il: z.string().describe("Province, e.g. 'Ankara', 'Istanbul'"),
        }),
        annotations: READ_ONLY,
    }, async ({ il }) => {
        try {
            return text(await listDistricts(il));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_daily", {
        title: "Get daily forecast",
        description: "MGM multi-day forecast for a station. Use gunlukTahminIstNo from list_districts.",
        inputSchema: z.object({
            istno: z.string().describe("Forecast station id"),
        }),
        annotations: READ_ONLY,
    }, async ({ istno }) => {
        try {
            return text(await getDaily(istno));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_hourly", {
        title: "Get hourly forecast",
        description: "MGM hourly forecast steps for a station.",
        inputSchema: z.object({
            istno: z.string().describe("Forecast station id"),
        }),
        annotations: READ_ONLY,
    }, async ({ istno }) => {
        try {
            return text(await getHourly(istno));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("current_conditions", {
        title: "Current conditions",
        description: "Live observation from an MGM station: temperature, humidity, pressure, wind, " +
            "visibility, cloud cover and precipitation totals. Use sondurumIstNo from list_districts.",
        inputSchema: z.object({
            istno: z.string().describe("Observation station id (sondurumIstNo)"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement conditions locally (paywall removed)
        try {
            return textError("Not yet implemented: conditions");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("province_board", {
        title: "Province board",
        description: "Multi-day low/high forecast for every district in a Turkish province, side by side.",
        inputSchema: z.object({
            il: z.string().describe("Province, e.g. 'Ankara', 'Istanbul'"),
            days: z.number().int().min(1).max(5).default(3),
            limit: z.number().int().min(1).max(40).default(15),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement board locally (paywall removed)
        try {
            return textError("Not yet implemented: board");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "mgm-mcp";
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
