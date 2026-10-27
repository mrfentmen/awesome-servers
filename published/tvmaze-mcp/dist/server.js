import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_schedule, m0_search, m1_searchShows, m1_showEpisodes, m1_todaySchedule } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'tvmaze-mcp', version: '1.0.0' });
    server.registerTool("search", {
        title: "Search",
        description: "Search shows.",
        inputSchema: z.object({ query: z.string().describe("Show name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("schedule", {
        title: "Schedule",
        description: "Schedule for a date and country.",
        inputSchema: z.object({ country: z.string().describe("ISO country like US.").optional(), date: z.string().describe("YYYY-MM-DD.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_schedule(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_shows", {
        title: "Search shows",
        description: "Search for TV shows by name.",
        inputSchema: z.object({ query: z.string().describe("Show name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_searchShows(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("show_episodes", {
        title: "Show episodes",
        description: "List episodes for a show by TVMaze ID.",
        inputSchema: z.object({ showId: z.number().describe("TVMaze show ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_showEpisodes(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("today_schedule", {
        title: "Today schedule",
        description: "List shows airing today.",
        inputSchema: z.object({ country: z.string().describe("Two letter country code.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_todaySchedule(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("show_lookup", {
        title: "Show lookup",
        description: "Resolve a show from an id another database holds - TheTVDB, IMDb or TVRage - into its TVMaze record, so you can skip a name search.",
        inputSchema: z.object({ tvdb: z.string().describe("TheTVDB show id, e.g. 121361.").optional(), imdb: z.string().describe("IMDb show id, e.g. tt0944947.").optional(), tvrage: z.string().describe("TVRage show id.").optional() }),
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
    const serverName = "tvmaze-mcp";
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
