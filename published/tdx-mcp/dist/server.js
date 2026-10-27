import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listTraStations, getTraLiveboard, listThsrStations, getTraTimetable, odsStationSearch } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "tdx-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_tra_stations", {
        title: "List TRA stations",
        description: "Taiwan Railway stations with ids, names, coordinates for live boards.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listTraStations());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_tra_liveboard", {
        title: "Get TRA live board",
        description: "Live Taiwan Railway departures and arrivals for a station.",
        inputSchema: z.object({
            stationId: z.string().describe("Station id from list_tra_stations"),
        }),
        annotations: READ_ONLY,
    }, async ({ stationId }) => {
        try {
            return text(await getTraLiveboard(stationId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_thsr_stations", {
        title: "List THSR stations",
        description: "Taiwan High Speed Rail stations with ids and addresses.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listThsrStations());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_tra_timetable", {
        title: "Get TRA timetable",
        description: "Taiwan Railway daily timetable for a station on a date.",
        inputSchema: z.object({
            stationId: z.string().describe("Station id"),
            date: z.string().describe("Date YYYY-MM-DD"),
        }),
        annotations: READ_ONLY,
    }, async ({ stationId, date }) => {
        try {
            return text(await getTraTimetable(stationId, date));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ods_station_search", {
        title: "Search TRA stations",
        description: "Search Taiwan Railway stations from the rail company's open data station list: code, Chinese and English name, address, phone, GPS coordinates and bike rental.",
        inputSchema: z.object({
            query: z.string().describe("Station code, Chinese name or English name, e.g. '1000', 'Taipei', '板橋'"),
            limit: z.number().int().min(1).max(30).default(8),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await odsStationSearch({ query, limit }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ods_train_departures", {
        title: "TRA departures board",
        description: "Real Taiwan Railway departures for one station on one published date, from the rail company's open daily timetable: departure time, train number, line and its origin and destination.",
        inputSchema: z.object({
            stationId: z.string().describe("4-digit station code from ods_station_search, e.g. 1000 for Taipei"),
            date: z.string().default("").describe("Date YYYYMMDD. Empty = newest published timetable."),
            limit: z.number().int().min(1).max(60).default(12),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            // TODO: implement departures locally (paywall removed)
            try {
                return textError("Not yet implemented: departures");
            }
            catch (e) {
                return textError(String(e));
            }
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ods_train_route", {
        title: "TRA train route",
        description: "The whole run of one Taiwan Railway train on one published date: every stop with arrival and departure times and station names, plus carriage class, bike, dining and accessibility flags.",
        inputSchema: z.object({
            trainNumber: z.string().describe("Train number, e.g. 1001"),
            date: z.string().default("").describe("Date YYYYMMDD. Empty = newest published timetable."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            // TODO: implement route locally (paywall removed)
            try {
                return textError("Not yet implemented: route");
            }
            catch (e) {
                return textError(String(e));
            }
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "tdx-mcp";
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
    return server;
}
