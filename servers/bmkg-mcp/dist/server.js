import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, getForecast, getFeltEarthquakes, getLatestEarthquakes, latestEarthquake, forecastSummary, feltEarthquakeSummary } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "bmkg-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_forecast", {
        title: "Get village forecast",
        description: "3-hourly 3-day BMKG forecast for an Indonesian village by adm4 code (e.g. 31.71.03.1001 Kemayoran, Jakarta). Codes at kodewilayah.id.",
        inputSchema: z.object({
            adm4: z.string().describe("Village code W.X.Y.Z"),
        }),
        annotations: READ_ONLY,
    }, async ({ adm4 }) => {
        try {
            return text(await getForecast(adm4));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_felt_earthquakes", {
        title: "Get felt earthquakes",
        description: "Recently felt Indonesian earthquakes: magnitude, depth, location, MMI scale.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getFeltEarthquakes());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_latest_earthquakes", {
        title: "Get latest earthquakes",
        description: "Latest Indonesian earthquakes M5+: time, coordinates, magnitude, region.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getLatestEarthquakes());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("latest_earthquake", {
        title: "Latest earthquake",
        description: "The single most recent BMKG earthquake in full: magnitude, depth, coordinates, tsunami potential and where it was felt.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        // ---- paywall: latest_earthquake ----
        const paywallMessage = await premiumRequired("latest_earthquake");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await latestEarthquake());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("forecast_summary", {
        title: "Forecast summary",
        description: "Compact BMKG forecast periods for one Indonesian village with weather, temperature, rainfall, wind and humidity.",
        inputSchema: z.object({ adm4: z.string().describe("Village code W.X.Y.Z"), limit: z.number().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await forecastSummary(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("felt_earthquake_summary", {
        title: "Felt earthquake summary",
        description: "Readable summary of recent Indonesian earthquakes that BMKG reports as felt, with time, magnitude, depth, region and felt intensity.",
        inputSchema: z.object({ limit: z.number().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await feltEarthquakeSummary(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
