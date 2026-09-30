import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, listCollections, getCollection, queryCollection, inventorySummary } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "eccc-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_collections",
    {
      title: "List collections",
      description: "All MSC GeoMet collections: weather, climate, water datasets and products.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listCollections());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_collection",
    {
      title: "Get collection info",
      description: "Metadata for one GeoMet collection: description, links, extent.",
      inputSchema: z.object({
        collectionId: z.string().describe("Collection id from list_collections"),
      }),
      annotations: READ_ONLY,
    },
    async ({ collectionId }) => {
      try {
        return text(await getCollection(collectionId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "query_collection",
    {
      title: "Query collection items",
      description: "Query items in a GeoMet collection with optional bounding box.",
      inputSchema: z.object({
        collectionId: z.string().describe("Collection id"),
        bbox: z.string().optional().describe("Bounding box 'minlon,minlat,maxlon,maxlat'"),
        limit: z.number().default(10).describe("How many items"),
      }),
      annotations: READ_ONLY,
    },
    async ({ collectionId, bbox, limit }) => {
      try {
        return text(await queryCollection(collectionId, bbox, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_collections",
    {
      title: "Search collections",
      description: "Find the MSC GeoMet collection that carries a subject: matches on id, title, description and keywords, with item type, keywords and spatial and temporal coverage.",
      inputSchema: z.object({
        query: z.string().describe("Search terms, e.g. hurricane, climate, hydrometric"),
        limit: z.number().describe("Max results, 1-50.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: search_collections ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_eccc_search_collections", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "inventory_summary",
    {
      title: "Inventory summary",
      description: "Tally what a point-based GeoMet collection holds inside a bounding box: how many items match, how many carry point geometry, and the breakdown by province or territory and by status, instead of listing every row.",
      inputSchema: z.object({
        collectionId: z.string().describe("Collection id, e.g. hydrometric-stations"),
        bbox: z.string().optional().describe("Bounding box 'minlon,minlat,maxlon,maxlat'"),
        limit: z.number().describe("How many items to inspect, 1-500.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await inventorySummary(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "nearest_items",
    {
      title: "Nearest items",
      description: "What sits nearest a point in any point-based GeoMet collection: sends the search box itself, then ranks the returned point geometry by real great-circle distance.",
      inputSchema: z.object({
        collectionId: z.string().describe("Collection id, e.g. hydrometric-stations"),
        lon: z.number().describe("Longitude, -180 to 180."),
        lat: z.number().describe("Latitude, -90 to 90."),
        radiusKm: z.number().describe("Search radius in km, 1-400.").optional(),
        limit: z.number().describe("Max results, 1-40.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: nearest_items ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_eccc_nearest_items", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "item_detail",
    {
      title: "Item detail",
      description: "One MSC GeoMet collection item by id, with every property the service holds for it. The other tools reach a collection by listing it or by bounding box, so the row behind an id you already hold is not readable through them.",
      inputSchema: z.object( { collectionId: z.string().describe("Collection id, e.g. hydrometric-stations."), itemId: z.string().describe("Item id within that collection, e.g. 01AA002.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: item_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_eccc_item_detail", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
