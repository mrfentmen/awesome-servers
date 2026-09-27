import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { discoverMovies, discoverTv, movieCredits, movieDetails, personDetails, tvDetails } from "./api.js"
import { searchMovie } from "./api.js"
import { searchPerson } from "./api.js"
import { searchTv } from "./api.js"
import { trending } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "tmdb-mcp", version: "1.0.0" })
  server.registerTool(
    "search_movie",
    {
      title: "Search movie",
      description: "Search for movies by title.",
      inputSchema: z.object( { query: z.string().describe("Movie title to search for."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchMovie(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_tv",
    {
      title: "Search tv",
      description: "Search for TV shows by title.",
      inputSchema: z.object( { query: z.string().describe("TV show title to search for."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchTv(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "trending",
    {
      title: "Trending",
      description: "Get trending movies and TV shows for the week.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await trending(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_person",
    {
      title: "Search person",
      description: "Search actors and directors.",
      inputSchema: z.object( { query: z.string().describe("Person name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchPerson(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "movie_details",
    {
      title: "Movie details",
      description: "Full movie record.",
      inputSchema: z.object( { id: z.string().describe("TMDB movie id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await movieDetails(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "tv_details",
    {
      title: "TV details",
      description: "Full TV show record.",
      inputSchema: z.object( { id: z.string().describe("TMDB TV id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tvDetails(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "person_details",
    {
      title: "Person details",
      description: "Actor bio.",
      inputSchema: z.object( { id: z.string().describe("TMDB person id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await personDetails(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "movie_credits",
    {
      title: "Movie credits",
      description: "Cast and director.",
      inputSchema: z.object( { id: z.string().describe("TMDB movie id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await movieCredits(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "discover_movies",
    {
      title: "Discover movies",
      description: "Popular movies, optional genre and year.",
      inputSchema: z.object( { genre: z.string().describe("Genre id like 28.").optional(), year: z.string().describe("Release year.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await discoverMovies(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "discover_tv",
    {
      title: "Discover TV",
      description: "Popular TV shows, optional genre.",
      inputSchema: z.object( { genre: z.string().describe("Genre id like 18.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await discoverTv(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
