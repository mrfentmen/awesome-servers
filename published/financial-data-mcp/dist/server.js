import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fredSeries, treasuryRates, series_compare } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "financial-data-mcp", version: "1.0.0" });
    server.registerTool("get_fred_series", {
        title: "Get fred series",
        description: "Get a FRED economic series such as GDP or unemployment.",
        inputSchema: z.object({ series_id: z.string().describe("FRED series id like GDP or UNRATE."), limit: z.number().describe("Max data points.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await fredSeries(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_treasury_rates", {
        title: "Get treasury rates",
        description: "Get the latest US Treasury yield curve rates.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await treasuryRates(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("series_trend", {
        title: "FRED series trend",
        description: "What a FRED series did over a window: change, percent change, high, low, mean, and the move split into thirds to separate a steady drift from one jump.",
        inputSchema: z.object({
            series_id: z.string().optional().describe("FRED series id like DGS10 or UNRATE. Defaults to GDP."),
            limit: z.number().optional().describe("How many of the most recent observations to analyse, 2 to 5000. Defaults to 250."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement trend locally (paywall removed)
        try {
            return textError("Not yet implemented: trend");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("series_compare", {
        title: "Compare FRED series",
        description: "Compare 2 to 4 FRED series over the same window, reporting each one's change and then a date-aligned table of the observations they have in common.",
        inputSchema: z.object({
            series_ids: z.array(z.string()).describe("Two to four FRED series ids, for example DGS10 and UNRATE."),
            limit: z.number().optional().describe("How many of the most recent observations to use per series, 2 to 5000. Defaults to 250."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await series_compare(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("treasury_curve_history", {
        title: "Treasury curve history",
        description: "How the US Treasury yield curve moved: every tenor now against the nearest session a set number of days back, the 2s10s spread and whether it inverted, plus the recent spread series.",
        inputSchema: z.object({
            days_ago: z.number().optional().describe("How many days back to compare against, 0 to 120. Defaults to 30."),
            year: z.number().optional().describe("Feed year to read. Defaults to the current year."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement history locally (paywall removed)
        try {
            return textError("Not yet implemented: history");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("series_window", {
        title: "FRED series over a date window",
        description: "Read a FRED series over an explicit past date range, optionally resampled to daily, weekly, monthly, quarterly or annual and aggregated by avg or sum, reporting the first and last observation, the change across the window, and the high and low with their dates. get_fred_series and series_trend both take a count of the most recent observations, so neither can answer a question about a window in the past. FRED accepts an unknown frequency and silently ignores it, so an unrecognised one is refused here rather than passed on.",
        inputSchema: z.object({
            series_id: z.string().describe("FRED series id like DGS10 or UNRATE."),
            start: z.string().describe("Start date as YYYY-MM-DD."),
            end: z.string().describe("End date as YYYY-MM-DD."),
            frequency: z.string().describe("daily, weekly, monthly, quarterly or annual. Optional, the series' own frequency otherwise.").optional(),
            aggregate: z.string().describe("avg or sum, only meaningful with a frequency. Optional.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement window locally (paywall removed)
        try {
            return textError("Not yet implemented: window");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "financial-data-mcp";
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
