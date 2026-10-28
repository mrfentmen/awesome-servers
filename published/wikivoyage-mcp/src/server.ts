import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  links,
  nearby,
  overview,
  random,
  randomWithOverviews,
  search,
  sections,
  WikivoyageError,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof WikivoyageError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "wikivoyage-mcp", version: "1.0.0" })

  server.tool(
    "search_destinations",
    "Search Wikivoyage travel guides.",
    {
      query: z.string().min(1).describe("Place or topic, e.g. Kyoto"),
      limit: z.number().int().min(1).max(30).default(10).describe("Results"),
    },
    async ({ query, limit }) => {
      try {
        return text(await search(query, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "destination_overview",
    "The opening section of a Wikivoyage destination guide.",
    { title: z.string().min(1).describe("Exact article title, e.g. Kyoto") },
    async ({ title }) => {
      try {
        return text(await overview(title))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "destination_sections",
    "The table of contents for a destination guide: see, do, eat, sleep and the rest.",
    { title: z.string().min(1).describe("Exact article title") },
    async ({ title }) => {
      try {
        return text(await sections(title))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "nearby_destinations",
    "Wikivoyage articles near a coordinate.",
    {
      lat: z.number().describe("Latitude"),
      lon: z.number().describe("Longitude"),
      radius_m: z.number().int().min(100).max(100000).default(10000).describe("Radius in metres"),
      limit: z.number().int().min(1).max(50).default(15).describe("Results"),
    },
    async ({ lat, lon, radius_m, limit }) => {
      try {
        return text(await nearby(lat, lon, radius_m, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "destination_links",
    "Articles a destination guide links to — useful for building a route.",
    {
      title: z.string().min(1).describe("Exact article title"),
      limit: z.number().int().min(1).max(200).default(50).describe("Links"),
    },
    async ({ title, limit }) => {
      try {
        return text(await links(title, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "random_destination",
    "A random destination, optionally with a two-sentence overview.",
    {
      limit: z.number().int().min(1).max(10).default(3).describe("How many"),
      with_overview: z.boolean().default(true).describe("Include a short extract"),
    },
    async ({ limit, with_overview }) => {
      try {
        return text(with_overview ? await randomWithOverviews(limit) : await random(limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
