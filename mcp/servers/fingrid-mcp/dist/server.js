import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listDatasets, getRecords, dayAheadPrices } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "fingrid-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_datasets", {
        title: "List datasets",
        description: "Fingrid open datasets with ids for record queries.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listDatasets());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_records", {
        title: "Get records",
        description: "Records from a Fingrid dataset in a time window.",
        inputSchema: z.object({
            datasetId: z.string().describe("Dataset id from list_datasets"),
            startTime: z.string().optional().describe("Start ISO datetime"),
            endTime: z.string().optional().describe("End ISO datetime"),
        }),
        annotations: READ_ONLY,
    }, async ({ datasetId, startTime, endTime }) => {
        try {
            return text(await getRecords(datasetId, startTime, endTime));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("day_ahead_prices", {
        title: "Day-ahead prices",
        description: "Hourly day-ahead electricity price for Finland, Estonia, Latvia or Lithuania from Elering's public price feed, in local time with the cheapest and dearest hour called out. No FINGRID_API_KEY needed.",
        inputSchema: z.object({
            area: z.enum(["fi", "ee", "lv", "lt"]).default("fi").describe("Market area"),
            hours: z.number().int().min(6).max(168).default(36).describe("How many hours of prices to return"),
            start: z.string().optional().describe("Start time, e.g. 2026-09-28T00:00:00Z. Default now."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await dayAheadPrices(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("best_cheap_window", {
        title: "Find the cheapest run",
        description: "Find the cheapest and dearest contiguous window in the day-ahead price series and what a flat load would pay in each, against the window average. Uses Elering's public price feed, so no FINGRID_API_KEY needed.",
        inputSchema: z.object({
            area: z.enum(["fi", "ee", "lv", "lt"]).default("fi").describe("Market area"),
            hours: z.number().int().min(12).max(168).default(48).describe("How many hours of prices to search"),
            start: z.string().optional().describe("Start time, e.g. 2026-09-28T00:00:00Z. Default now."),
            window_hours: z.number().int().min(1).max(12).default(4).describe("Length of the run to find"),
            consumption_kwh: z.number().min(0.001).max(100000).default(1).describe("Load spread evenly over the window, in kWh"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: best_cheap_window ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_fingrid_best_cheap_window", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
