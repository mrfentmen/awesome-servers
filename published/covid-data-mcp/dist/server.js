import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { country, global, countryComparison } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "covid-data-mcp", version: "1.0.0" });
    server.registerTool("country", {
        title: "Country",
        description: "COVID stats for one country.",
        inputSchema: z.object({ name: z.string().describe("Country name or code.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await country(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("global", {
        title: "Global",
        description: "Global COVID totals.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await global(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("country_ranking", {
        title: "Country ranking",
        description: "Rank countries by cases, deaths, active, critical or per-million rates, with a population floor.",
        inputSchema: z.object({ metric: z.string().describe("cases, deaths, recovered, active, critical, deaths_per_million or cases_per_million.").optional(), limit: z.number().describe("Max countries.").optional(), min_population: z.number().describe("Ignore countries below this population.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement ranking locally (paywall removed)
        try {
            return textError("Not yet implemented: ranking");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("continent_report", {
        title: "Continent report",
        description: "COVID case, death, recovery and test totals for every continent, with each share of global deaths.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement report locally (paywall removed)
        try {
            return textError("Not yet implemented: report");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("country_comparison", {
        title: "Country comparison",
        description: "Side by side table of several countries: cases, deaths, per million rates, recovered, active, tests and population.",
        inputSchema: z.object({ countries: z.string().describe("Comma separated country names, e.g. France, Germany, Italy.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await countryComparison(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "covid-data-mcp";
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
    return server;
}
