import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { peopleInfo, planetInfo, searchPeople, searchPlanets } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "star-wars-mcp", version: "1.0.0" });
    server.registerTool("people_info", {
        title: "People info",
        description: "Get a Star Wars person by ID.",
        inputSchema: z.object({ id: z.number().describe("Person ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await peopleInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("planet_info", {
        title: "Planet info",
        description: "Get a Star Wars planet by ID.",
        inputSchema: z.object({ id: z.number().describe("Planet ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await planetInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_people", {
        title: "Search people",
        description: "Search Star Wars characters by name.",
        inputSchema: z.object({ query: z.string().describe("Character name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchPeople(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("film_info", {
        title: "Film info",
        description: "Get a Star Wars film by ID: title, episode number, release date, credits and opening crawl.",
        inputSchema: z.object({ id: z.number().describe("Film ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement info locally (paywall removed)
        try {
            return textError("Not yet implemented: info");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("starship_info", {
        title: "Starship info",
        description: "Get a Star Wars starship by ID: class, model, manufacturer, dimensions, capacity and cost.",
        inputSchema: z.object({ id: z.number().describe("Starship ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement info locally (paywall removed)
        try {
            return textError("Not yet implemented: info");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_planets", {
        title: "Search planets",
        description: "Search Star Wars planets by name and get their terrain, climate, gravity and population.",
        inputSchema: z.object({ query: z.string().describe("Planet name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchPlanets(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "star-wars-mcp";
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
