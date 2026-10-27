import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { indicator, search, indicator_dimensions } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "who-mcp", version: "1.0.0" });
    server.registerTool("indicator", {
        title: "Indicator",
        description: "Values for a WHO indicator.",
        inputSchema: z.object({ code: z.string().describe("Indicator code like WHOSIS_000001."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await indicator(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search", {
        title: "Search",
        description: "Search WHO indicators by text.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("indicator_dimensions", {
        title: "Indicator dimensions",
        description: "List the dimensions a WHO indicator can be sliced by, read from the IndicatorDimension set and named from the DIMENSION catalogue. Says plainly whether COUNTRY is registered, since that decides whether a SpatialDim value is an ISO 3166 alpha-3 country code or something else, and whether YEAR is registered. The existing tools read none of this, so there is no way with them to tell what a place code is encoded in.",
        inputSchema: z.object({
            code: z.string().describe("WHO indicator code, e.g. 'WHS4_100'. Use search to find one."),
        }),
        annotations: READ_ONLY,
    }, async ({ code }) => {
        try {
            return text(await indicator_dimensions({ code }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("indicator_series", {
        title: "Indicator series",
        description: "Read one WHO indicator for one place as a time series with year-on-year change, the low and high interval around each figure, the WHO region the place sits in, any sub-dimension the series is broken down by, the data source and when the rows were loaded, plus any source notes. The existing indicator tool prints place, time and value with none of that, so a change of direction and a confidence interval are both invisible through it.",
        inputSchema: z.object({
            code: z.string().describe("WHO indicator code, e.g. 'WHS4_100'."),
            place: z.string().describe("Place code, usually an ISO 3166 alpha-3 country code such as GBR or TON."),
            fromYear: z.number().int().min(1800).max(2200).optional().describe("Earliest year to include."),
            toYear: z.number().int().min(1800).max(2200).optional().describe("Latest year to include."),
            limit: z.number().int().min(1).max(60).optional().describe("How many points to return, earliest first. Default 20."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement series locally (paywall removed)
        try {
            return textError("Not yet implemented: series");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("indicator_places", {
        title: "Places for an indicator",
        description: "List the place codes a WHO indicator covers, taken from the data rows themselves, with each one's WHO region, how many years it has and the span, and whether the codes are all one type. Optionally narrowed to a region. The GHO service publishes no list of valid place codes anywhere, so the existing indicator tool can only be used with a code the caller already happens to know.",
        inputSchema: z.object({
            code: z.string().describe("WHO indicator code, e.g. 'WHS4_100'."),
            region: z.string().optional().describe("Narrow to one WHO region, e.g. 'Europe' or 'Western Pacific'."),
            limit: z.number().int().min(1).max(60).optional().describe("How many places to list. Default 25."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement places locally (paywall removed)
        try {
            return textError("Not yet implemented: places");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("place_lookup", {
        title: "Place lookup",
        description: "Resolve a WHO GHO place code to a country name and its WHO region, or list every country in one WHO region. The GHO service publishes no list of valid place codes and the Region table is empty, so this is the one route that turns a SpatialDim value into a name.",
        inputSchema: z.object({
            code: z.string().optional().describe("ISO 3166 alpha-3 place code, e.g. GBR."),
            region: z.string().optional().describe("WHO region code or name, e.g. EUR or Europe, to list its countries."),
            limit: z.number().int().min(1).max(266).optional().describe("How many countries to list when listing a region. Default 30."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement lookup locally (paywall removed)
        try {
            return textError("Not yet implemented: lookup");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "who-mcp";
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
