import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, gauges, latestValue, streamflow, WaterError } from "./api.js";
const text = (s) => ({ content: [{ type: "text", text: s }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({ name: "usgs-water-mcp", version: "1.0.0" });
    server.registerTool("get_streamflow", {
        title: "Get streamflow",
        description: "Get USGS instantaneous water observations for one gauge.",
        inputSchema: z.object({ site: z.string().min(1), parameter: z.string().default("00060").describe("USGS parameter code, 00060 is discharge"), start: z.string().optional(), end: z.string().optional() }),
        annotations: READ_ONLY,
    }, async ({ site, parameter, start, end }) => { try {
        return text(format(await streamflow(site, parameter, start, end)));
    }
    catch (e) {
        return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } });
    server.registerTool("find_gauges", {
        title: "Find gauges",
        description: "Find active USGS stream gauges in a longitude,latitude bounding box.",
        inputSchema: z.object({ bbox: z.string().describe("min longitude,min latitude,max longitude,max latitude"), limit: z.number().int().min(1).max(50).default(20) }),
        annotations: READ_ONLY,
    }, async ({ bbox, limit }) => { try {
        return text(format(await gauges(bbox, limit)));
    }
    catch (e) {
        return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } });
    server.registerTool("daily_values", {
        title: "Daily values",
        description: "USGS daily-value statistics for one gauge over a period, with the number of readings and the real minimum and maximum, rather than the raw JSON the streamflow tool returns.",
        inputSchema: z.object({ site: z.string().min(1).describe("USGS site number, like 01646500."), parameter: z.string().describe("USGS parameter code, 00060 is discharge, 00065 is gage height. Defaults to 00060.").optional(), period: z.string().describe("ISO period like P7D or P30D. Defaults to P7D.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement values locally (paywall removed)
        try {
            return textError("Not yet implemented: values");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("latest_value", {
        title: "Latest value",
        description: "The most recent instantaneous reading for one gauge in the last hour, with its timestamp, unit and whether USGS still marks it provisional.",
        inputSchema: z.object({ site: z.string().min(1).describe("USGS site number, like 01646500."), parameter: z.string().describe("USGS parameter code, 00060 is discharge. Defaults to 00060.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await latestValue(args));
        }
        catch (e) {
            return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
        }
    });
    const serverName = "usgs-water-mcp";
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
export { WaterError };
