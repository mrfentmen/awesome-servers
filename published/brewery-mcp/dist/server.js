import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { breweryStats, findBreweries, getBrewery, randomBrewery, searchAllBreweries, searchBreweries, autocompleteBreweries, randomBreweries, breweriesByIds, typesByRegion, nearestBreweries, recordCoverage } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "brewery-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_breweries", {
        title: "Search breweries",
        description: "Search breweries on one specific field. Returns names, types, addresses, websites and ids.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. Denver."),
            by: z.string().describe("name, city, state, type, country or postal (default name).").optional(),
            limit: z.string().describe("Max results (default 10).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, by, limit }) => {
        try {
            return text(await searchBreweries(query, by, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_all_breweries", {
        title: "Search all fields",
        description: "Free-text search across every brewery field — name, city, state, country, postal code and website — for when you do not know which field the text is in.",
        inputSchema: z.object({
            query: z.string().describe("Free text, e.g. dog or brewing."),
            limit: z.number().describe("Max results, 1-50 (default 10).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchAllBreweries(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("find_breweries", {
        title: "Find breweries",
        description: "List breweries matching structured filters — city, state, country, type and postal code — optionally sorted by name, city, state or type. Use it for questions like 'micro breweries in Vermont'.",
        inputSchema: z.object({
            city: z.string().describe("City name, e.g. denver.").optional(),
            state: z.string().describe("State or region, e.g. vermont.").optional(),
            country: z.string().describe("Country, e.g. Germany.").optional(),
            type: z.string().describe("micro, nano, regional, brewpub, large, planning, bar, contract, proprietor, closed.").optional(),
            postal: z.string().describe("Postal code, e.g. 05401.").optional(),
            sort: z.string().describe("Sort key and direction, e.g. name:asc or city:desc (default API order).").optional(),
            limit: z.number().describe("Max results, 1-50 (default 10).").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await findBreweries(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_brewery", {
        title: "Get brewery",
        description: "Full details for one brewery by its id, including address, coordinates and contact info.",
        inputSchema: z.object({
            brewery_id: z.string().describe("Brewery UUID from a search result.")
        }),
        annotations: READ_ONLY,
    }, async ({ brewery_id }) => {
        try {
            return text(await getBrewery(brewery_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("random_brewery", {
        title: "Random brewery",
        description: "A random brewery from the directory, useful for discovery and examples.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(await randomBrewery());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("brewery_stats", {
        title: "Brewery stats",
        description: "Directory totals from Open Brewery DB broken down by country, brewery type and state/region. Good for market sizing and picking valid filter values.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(await breweryStats());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("autocomplete_breweries", {
        title: "Autocomplete breweries",
        description: "Type-ahead suggestions for a partial brewery name, with the id needed by get_brewery and the address fields.",
        inputSchema: z.object({
            query: z.string().describe("Partial name, e.g. dog or bre."),
            limit: z.number().describe("Max results, 1-50 (default 10).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await autocompleteBreweries(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("random_breweries", {
        title: "Random breweries",
        description: "A batch of random breweries in one call, useful for sampling the directory or building a shortlist.",
        inputSchema: z.object({
            count: z.number().describe("How many breweries, 1-10 (default 3).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ count }) => {
        try {
            return text(await randomBreweries(count));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("breweries_by_ids", {
        title: "Breweries by ids",
        description: "Fetch up to 10 breweries by id in one call — the batch lookup for a list of ids collected from earlier results.",
        inputSchema: z.object({
            ids: z.string().describe("Comma-separated brewery ids (max 10)."),
            limit: z.number().describe("Max results, 1-50 (default: as many as ids given).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ ids, limit }) => {
        try {
            return text(await breweriesByIds(ids, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("nearest_breweries", {
        title: "Nearest breweries",
        description: "Breweries closest to a latitude and longitude, ranked by great-circle distance. Open Brewery DB has no radius filter, so this scans a catalogue sample and reports how much it looked at.",
        inputSchema: z.object({
            latitude: z.number().describe("Latitude, -90 to 90"),
            longitude: z.number().describe("Longitude, -180 to 180"),
            sample: z.number().int().min(1).max(10).default(3).describe("Catalogue pages of 200 to scan, default 3"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await nearestBreweries(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("record_coverage", {
        title: "Directory record coverage",
        description: "Data-quality audit of the Open Brewery DB directory: how many records carry coordinates, phone, website, street address, city and type, and which countries have the weakest coordinate coverage.",
        inputSchema: z.object({
            sample: z.number().int().min(1).max(10).default(2).describe("Catalogue pages of 200 to audit, default 2"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recordCoverage(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("types_by_region", {
        title: "Types by region",
        description: "Which brewery types appear in which country, with counts and share, across a catalogue sample. Optionally filter to one country.",
        inputSchema: z.object({
            country: z.string().optional().describe("Full country name, e.g. United States"),
            sample: z.number().int().min(1).max(10).default(2).describe("Catalogue pages of 200 to scan, default 2"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await typesByRegion(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    return server;
}
