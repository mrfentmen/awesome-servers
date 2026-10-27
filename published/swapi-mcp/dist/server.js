import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RESOURCES, SwapiError, detail, filmChronicle, listAll, personFilms, search } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SwapiError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "swapi-mcp", version: "1.0.0" });
    const resource = z.enum(RESOURCES).describe("Resource: people, planets, films, starships, vehicles or species");
    const limit = z.number().int().min(1).max(30).default(10).describe("Rows to return (1-30)");
    server.tool("search_star_wars", "Search any SWAPI resource by name.", {
        resource,
        query: z.string().min(2).describe("Name or part of it, e.g. 'luke', 'tatooine', 'x-wing'"),
        limit,
    }, async ({ resource: r, query, limit: n }) => {
        try {
            return text(await search(r, query, n));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("star_wars_detail", "One record by id with its full field list.", {
        resource,
        id: z.number().int().min(1).max(100).describe("Record id, e.g. 1 for Luke Skywalker"),
    }, async ({ resource: r, id }) => {
        try {
            return text(await detail(r, id));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("list_resource", "First page of one resource, for browsing.", { resource, limit }, async ({ resource: r, limit: n }) => {
        try {
            return text(await listAll(r, n));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("film_chronicle", "All nine films in story order with director and year.", {}, async () => {
        try {
            return text(await filmChronicle());
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("character_films", "Which films a character appears in, with titles.", { id: z.number().int().min(1).max(100).describe("People id, e.g. 1 for Luke Skywalker") }, async ({ id }) => {
        try {
            return text(await personFilms(id));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
