import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search_artworks, artwork, artist_search, artist, artwork_image_url, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "artic-mcp", version: "1.0.0" })

  server.tool(
    "search_artworks",
    "Search the Art Institute collection",
    {
      query: z.string().min(2).describe("Search text, e.g. sunflowers"),
      limit: z.number().int().min(1).max(20).default(10).describe("Maximum artworks")
    },
    async (a) => {
      try {
        return text(await search_artworks(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "artwork",
    "Full record for one artwork",
    {
      artworkId: z.number().int().min(1).describe("Artwork id, e.g. 129884")
    },
    async (a) => {
      try {
        return text(await artwork(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "artist_search",
    "Search artists represented in the collection",
    {
      query: z.string().min(2).describe("Artist name"),
      limit: z.number().int().min(1).max(20).default(10).describe("Maximum artists")
    },
    async (a) => {
      try {
        return text(await artist_search(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "artist",
    "Artist biography and dates",
    {
      artistId: z.number().int().min(1).describe("Artist id, e.g. 35809")
    },
    async (a) => {
      try {
        return text(await artist(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "artwork_image_url",
    "IIIF image URL for an artwork",
    {
      artworkId: z.number().int().min(1).describe("Artwork id, e.g. 129884"),
      width: z.number().int().min(100).max(3000).default(843).describe("Image width in pixels")
    },
    async (a) => {
      try {
        return text(await artwork_image_url(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
