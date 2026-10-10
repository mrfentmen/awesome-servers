import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { peopleInfo, planetInfo, searchPeople, searchPlanets } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "star-wars-mcp", version: "1.0.0" })
  server.registerTool(
    "people_info",
    {
      title: "People info",
      description: "Get a Star Wars person by ID.",
      inputSchema: z.object( { id: z.number().describe("Person ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await peopleInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "planet_info",
    {
      title: "Planet info",
      description: "Get a Star Wars planet by ID.",
      inputSchema: z.object( { id: z.number().describe("Planet ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await planetInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_people",
    {
      title: "Search people",
      description: "Search Star Wars characters by name.",
      inputSchema: z.object( { query: z.string().describe("Character name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchPeople(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "film_info",
    {
      title: "Film info",
      description: "Get a Star Wars film by ID: title, episode number, release date, credits and opening crawl.",
      inputSchema: z.object( { id: z.number().describe("Film ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: film_info ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_star_wars_film_info", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "starship_info",
    {
      title: "Starship info",
      description: "Get a Star Wars starship by ID: class, model, manufacturer, dimensions, capacity and cost.",
      inputSchema: z.object( { id: z.number().describe("Starship ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: starship_info ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_star_wars_starship_info", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "search_planets",
    {
      title: "Search planets",
      description: "Search Star Wars planets by name and get their terrain, climate, gravity and population.",
      inputSchema: z.object( { query: z.string().describe("Planet name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchPlanets(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
