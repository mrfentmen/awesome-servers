import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, searchMovies, getMovie, findFilmIds, wikidataFacts, cinemetaDetails } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "omdb-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_movies", {
        title: "Search movies",
        description: "Title search (needs OMDB_API_KEY).",
        inputSchema: z.object({
            query: z.string().describe("Title text, e.g. Blade Runner."),
            page: z.string().describe("Page number.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, page }) => {
        try {
            return text(await searchMovies(query, page));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_movie", {
        title: "Get movie",
        description: "Full details by IMDb ID or exact title.",
        inputSchema: z.object({
            id_or_title: z.string().describe("tt1234567 or exact title.")
        }),
        annotations: READ_ONLY,
    }, async ({ id_or_title }) => {
        try {
            return text(await getMovie(id_or_title));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("find_film_ids", {
        title: "Find film ids",
        description: "Resolve a title to the right film: the Wikidata items that match, each with its description, publication year and IMDb id, flagging when the match came from an alias rather than the label. Use this to pick an entity before pulling facts.",
        inputSchema: z.object({
            title: z.string().describe("Film title to look for, e.g. 'Blade Runner'."),
            limit: z.number().describe("How many candidates to show, 1-12.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await findFilmIds(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("wikidata_facts", {
        title: "Wikidata facts",
        description: "The hand-curated facts Wikidata holds for a film: instance of, release date, running time, country, original language, directors, credited cast, production company, IMDb and TMDb ids, and how many Wikipedia sitelinks exist, each linked value shown with its Q-id.",
        inputSchema: z.object({
            id: z.string().describe("Wikidata Q-id such as Q184843.").optional(),
            title: z.string().describe("Title to look up when you have no Q-id; the best match is used.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: wikidata_facts ----
        const paywallMessage = await premiumRequired("wikidata_facts");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await wikidataFacts(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("cinemeta_details", {
        title: "Cinemeta details",
        description: "A second provider's view of the same film from Cinemeta: synopsis, runtime, genres, director, cast, community IMDb rating, awards, and which streaming sources currently carry it, so you can compare it against OMDb rather than trusting one.",
        inputSchema: z.object({ imdb_id: z.string().describe("IMDb id such as tt0083658, digits alone are accepted too.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: cinemeta_details ----
        const paywallMessage = await premiumRequired("cinemeta_details");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await cinemetaDetails(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
