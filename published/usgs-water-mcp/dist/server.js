import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { dailyValues, format, gauges, parameterCodes, siteInfo, streamflow, WaterError } from "./api.js";
const text = (s) => ({ content: [{ type: "text", text: s }] });
const fail = (s) => ({ content: [{ type: "text", text: s }], isError: true });
function errorMessage(e) {
    if (e instanceof WaterError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "usgs-water-mcp", version: "1.0.2" });
    server.tool("get_streamflow", "Get USGS instantaneous water observations for one gauge.", {
        site: z.string().min(1).describe("USGS site number, e.g. 06752260"),
        parameter: z.string().default("00060").describe("USGS parameter code, 00060 is discharge"),
        start: z.string().optional().describe("Start date, YYYY-MM-DD"),
        end: z.string().optional().describe("End date, YYYY-MM-DD")
    }, async (a) => {
        try {
            return text(format(await streamflow(a.site, a.parameter, a.start, a.end)));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("find_gauges", "Find active USGS stream gauges in a longitude,latitude bounding box.", {
        bbox: z.string().describe("min longitude,min latitude,max longitude,max latitude"),
        limit: z.number().int().min(1).max(50).default(20).describe("Gauges to return")
    }, async (a) => {
        try {
            return text(format(await gauges(a.bbox, a.limit)));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("site_info", "Site metadata for a USGS gauge: name, county, drainage area and coordinates.", {
        site: z.string().min(1).describe("USGS site number, e.g. 06752260")
    }, async (a) => {
        try {
            return text(format(await siteInfo(a)));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("daily_values", "Daily values for a USGS gauge over a date range.", {
        site: z.string().min(1).describe("USGS site number"),
        parameter: z.string().default("00060").describe("USGS parameter code, 00060 is discharge"),
        start: z.string().optional().describe("Start date, YYYY-MM-DD"),
        end: z.string().optional().describe("End date, YYYY-MM-DD")
    }, async (a) => {
        try {
            return text(format(await dailyValues(a)));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("parameter_codes", "Common USGS parameter codes with names and units.", {}, async () => {
        try {
            return text(format(parameterCodes()));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
export { WaterError };
