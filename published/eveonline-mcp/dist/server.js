import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getStatus, search, getCharacter, getCorporation, getAlliance, getMarketPrices, incursionWatch } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "eveonline-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_status", {
        title: "Get Tranquility status",
        description: "EVE Online server status: online players, server version, start time.",
        inputSchema: z.object({
            datasource: z.string().default("tranquility").describe("Datasource, usually tranquility"),
        }),
        annotations: READ_ONLY,
    }, async ({ datasource }) => {
        try {
            return text(await getStatus(datasource));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search", {
        title: "Search New Eden",
        description: "Universal EVE search across characters, corporations, alliances, items, systems and more.",
        inputSchema: z.object({
            query: z.string().describe("Search text"),
            categories: z.string().describe("Comma list, e.g. 'character,corporation,alliance,solar_system,inventory_type'"),
            strict: z.boolean().default(false).describe("Strict matching"),
            datasource: z.string().default("tranquility").describe("Datasource"),
        }),
        annotations: READ_ONLY,
    }, async ({ query, categories, strict, datasource }) => {
        try {
            return text(await search(query, categories, strict, datasource));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_character", {
        title: "Get character info",
        description: "Public EVE character info: name, corporation, alliance, birthday, security status.",
        inputSchema: z.object({
            characterId: z.number().describe("Character id"),
            datasource: z.string().default("tranquility").describe("Datasource"),
        }),
        annotations: READ_ONLY,
    }, async ({ characterId, datasource }) => {
        try {
            return text(await getCharacter(characterId, datasource));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_corporation", {
        title: "Get corporation info",
        description: "Public EVE corporation info: name, ticker, alliance, member count, description.",
        inputSchema: z.object({
            corporationId: z.number().describe("Corporation id"),
            datasource: z.string().default("tranquility").describe("Datasource"),
        }),
        annotations: READ_ONLY,
    }, async ({ corporationId, datasource }) => {
        try {
            return text(await getCorporation(corporationId, datasource));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_alliance", {
        title: "Get alliance info",
        description: "Public EVE alliance info: name, ticker, corporations, executor corp.",
        inputSchema: z.object({
            allianceId: z.number().describe("Alliance id"),
            datasource: z.string().default("tranquility").describe("Datasource"),
        }),
        annotations: READ_ONLY,
    }, async ({ allianceId, datasource }) => {
        try {
            return text(await getAlliance(allianceId, datasource));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_market_prices", {
        title: "Get market prices",
        description: "Universe-wide average and adjusted market prices for all EVE item types.",
        inputSchema: z.object({
            datasource: z.string().default("tranquility").describe("Datasource"),
        }),
        annotations: READ_ONLY,
    }, async ({ datasource }) => {
        try {
            return text(await getMarketPrices(datasource));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("faction_directory", {
        title: "Faction directory",
        description: "Lists the 27 factions with the corporation that runs each one, its home solar system, its station and system counts, whether it has a militia corporation that can hold territory, and whether it is one of the four unique empires. This is static political reference data and the only political view the server can reach, since all six existing tools are per-entity lookups. Filter by faction id or search name and description text.",
        inputSchema: z.object({
            faction_id: z.number().int().optional().describe("Single faction id, e.g. 500003 for Amarr Empire."),
            search: z.string().optional().describe("Case-insensitive text matched against faction names and descriptions."),
            include_description: z.boolean().default(true).describe("Include full faction descriptions. Default true"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement directory locally (paywall removed)
        try {
            return textError("Not yet implemented: directory");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("region_profile", {
        title: "Region profile",
        description: "Resolves a region id to its name, description and the constellations inside it, and can search regions by name. This is necessary rather than merely useful: the region list on this ESI deployment returns bare integers with no names, so a region id cannot be named any other way, and EVE has around a hundred regions. Pass a single region_id, or name_search to find one, which has to fetch regions one at a time because of that same stubbed list.",
        inputSchema: z.object({
            region_id: z.number().int().optional().describe("Single region id, e.g. 10000002 for The Forge."),
            name_search: z.string().optional().describe("Find regions whose name contains this text. Fetches regions individually."),
            limit: z.number().int().min(1).max(100).default(25).describe("Maximum matches for name_search, default 25"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("incursion_watch", {
        title: "Factional warfare state",
        description: "Reports the current state of factional warfare: which constellations each faction has infested, how many solar systems that covers, and whether a sanctioned boss capital-complex assault is running. Read once, not a watch, and the solar systems come back as ids because the system detail routes are not served here. Filter by faction or constellation.",
        inputSchema: z.object({
            faction_id: z.number().int().optional().describe("Only show this faction's incursions."),
            constellation_id: z.number().int().optional().describe("Only show incursions in this constellation."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await incursionWatch(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "eveonline-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    return server;
}
