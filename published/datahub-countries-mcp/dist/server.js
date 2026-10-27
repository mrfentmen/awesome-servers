import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { list, regionSummary } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "datahub-countries-mcp", version: "1.0.0" });
    server.registerTool("list", {
        title: "List",
        description: "List countries with codes.",
        inputSchema: z.object({ search: z.string().describe("Optional search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await list(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("country_details", {
        title: "Country details",
        description: "Full record for one country from any ISO, M49, FIFA or numeric code: capital, continent, region, calling code, TLD, languages, currency, development flags and cross reference codes.",
        inputSchema: z.object({ code: z.string().describe("Name or any code, e.g. FR, FRA, 250 or 33.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement details locally (paywall removed)
        try {
            return textError("Not yet implemented: details");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("code_lookup", {
        title: "Code lookup",
        description: "Reverse lookup across the code tables the country list also carries, including ISO alpha-2 and alpha-3, numeric, M49, FIFA, calling code, MARC, FIPS, WMO, ITU, IOC, TLD, Wikidata and Geonames.",
        inputSchema: z.object({ code: z.string().describe("Any code, e.g. 250, FRA, 33, .fr or Q142.") }),
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
    server.registerTool("region_summary", {
        title: "Region summary",
        description: "Group every country code entry by continent, region, intermediate region or sub-region with entry counts, independent state counts and the ISO codes in each group.",
        inputSchema: z.object({ level: z.string().describe("Continent, Region Name, Intermediate Region Name or Sub-region Name.").optional(), limit: z.number().describe("Max groups.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await regionSummary(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "datahub-countries-mcp";
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
