import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { byName, recent, hostStars } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "exoplanets-mcp", version: "1.0.0" });
    server.registerTool("recent", {
        title: "Recent",
        description: "Recently confirmed exoplanets.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recent(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("by_name", {
        title: "By name",
        description: "Look up an exoplanet by name.",
        inputSchema: z.object({ name: z.string().describe("Planet name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await byName(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("planet_stats", {
        title: "Planet stats",
        description: "Group the confirmed exoplanet catalogue by discovery method, discovery year, host star, spectral type or planet letter, with live counts from the NASA Exoplanet Archive.",
        inputSchema: z.object({ group_by: z.string().describe("discoverymethod, discovery_year, host, stellar_type or planet_type.").optional(), min_year: z.number().describe("Only planets discovered in or after this year.").optional(), limit: z.number().describe("Max groups.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement stats locally (paywall removed)
        try {
            return textError("Not yet implemented: stats");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("query_exoplanets", {
        title: "Query exoplanets",
        description: "Run a read-only ADQL query against the NASA Exoplanet Archive, choosing any columns, a where filter, an order by clause and a row limit across the published planet tables.",
        inputSchema: z.object({ select: z.string().describe("Columns, e.g. pl_name, disc_year, st_teff."), where: z.string().describe("ADQL where filter.").optional(), order: z.string().describe("ADQL order by clause.").optional(), limit: z.number().describe("Max rows.").optional(), table: z.string().describe("pscomppars, ps, psphot, psparameters or transit_planets.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement exoplanets locally (paywall removed)
        try {
            return textError("Not yet implemented: exoplanets");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("host_stars", {
        title: "Host stars",
        description: "Every confirmed planet around a host star with orbital period, radius, mass, equilibrium temperature, semi major axis, density and the stellar temperature, radius, mass and spectral type.",
        inputSchema: z.object({ host: z.string().describe("Host star name, e.g. Kepler-186."), limit: z.number().describe("Max planets.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await hostStars(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    const serverName = "exoplanets-mcp";
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
