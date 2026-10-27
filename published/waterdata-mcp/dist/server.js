import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { daily, describeSite, instantaneous, PARAMETERS, seriesLines, siteInfo, sitesInState, WaterError, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof WaterError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "waterdata-mcp", version: "1.0.0" });
    server.tool("site_info", "Look up a USGS gauge: station name, coordinates, state and county.", { site: z.string().min(1).describe("USGS site number, e.g. 01646500") }, async ({ site }) => {
        try {
            const rows = await siteInfo(site);
            if (!rows.length)
                return text(`No USGS site found for ${site}.`);
            return text(rows.slice(0, 10).map(describeSite).join("\n"));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("latest_reading", "The most recent instantaneous reading at a USGS gauge.", {
        site: z.string().min(1).describe("USGS site number"),
        parameter: z.string().default("00060").describe("Parameter code, default 00060 discharge"),
    }, async ({ site, parameter }) => {
        try {
            const series = await instantaneous(site, parameter, 1);
            return text(seriesLines(series, 3));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("readings_over_time", "Instantaneous readings for a gauge over the last N days.", {
        site: z.string().min(1).describe("USGS site number"),
        parameter: z.string().default("00060").describe("Parameter code"),
        days: z.number().int().min(1).max(30).default(3).describe("Days back"),
    }, async ({ site, parameter, days }) => {
        try {
            return text(seriesLines(await instantaneous(site, parameter, days), 40));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("daily_values", "Daily mean values for a gauge over the last N days.", {
        site: z.string().min(1).describe("USGS site number"),
        parameter: z.string().default("00060").describe("Parameter code"),
        days: z.number().int().min(1).max(365).default(14).describe("Days back"),
    }, async ({ site, parameter, days }) => {
        try {
            return text(seriesLines(await daily(site, parameter, days), 60));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("find_sites_in_state", "Find stream gauges with live data in a US state.", {
        state: z.string().length(2).describe("Two-letter state code, e.g. MD"),
        limit: z.number().int().min(1).max(100).default(20).describe("Rows to return"),
    }, async ({ state, limit }) => {
        try {
            const rows = await sitesInState(state, limit);
            if (!rows.length)
                return text(`No live stream gauges found for ${state}.`);
            return text(rows.map(describeSite).join("\n"));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("parameter_lookup", "Explain a USGS parameter code, or list the common ones.", { code: z.string().optional().describe("Parameter code, e.g. 00065; omit to list all") }, async ({ code }) => {
        if (!code) {
            return text(Object.entries(PARAMETERS)
                .map(([c, d]) => `${c}  ${d}`)
                .join("\n"));
        }
        const desc = PARAMETERS[code];
        return text(desc ? `${code}  ${desc}` : `Unknown code ${code}. Known: ${Object.keys(PARAMETERS).join(", ")}`);
    });
    return server;
}
