import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  assetFiles,
  byCenter,
  itemDetail,
  keywordSummary,
  NasaImagesError,
  recentMedia,
  searchMedia,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof NasaImagesError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "nasa-images-mcp", version: "1.0.0" })

  server.tool(
    "search_media",
    "Search the NASA image and video library by keyword.",
    {
      query: z.string().min(1).describe("Search term, e.g. mars rover"),
      media_type: z.enum(["any", "image", "video", "audio"]).default("any").describe("Restrict media type"),
      limit: z.number().int().min(1).max(50).default(10).describe("Results"),
    },
    async ({ query, media_type, limit }) => {
      try {
        return text(await searchMedia(query, media_type, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "item_detail",
    "Full record for one NASA asset by its NASA ID.",
    { nasa_id: z.string().min(3).describe("NASA ID, e.g. PIA04413") },
    async ({ nasa_id }) => {
      try {
        return text(await itemDetail(nasa_id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "asset_files",
    "Every downloadable file for a NASA asset, including full-resolution originals.",
    { nasa_id: z.string().min(3).describe("NASA ID, e.g. PIA04413") },
    async ({ nasa_id }) => {
      try {
        return text(await assetFiles(nasa_id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "by_center",
    "Images published by a NASA center (JPL, GSFC, HQ, MSFC, KSC, ...).",
    {
      center: z.string().min(2).describe("Center code, e.g. JPL"),
      limit: z.number().int().min(1).max(50).default(10).describe("Results"),
    },
    async ({ center, limit }) => {
      try {
        return text(await byCenter(center, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "recent_media",
    "Latest media added to the NASA library since a given year.",
    {
      year_start: z.number().int().min(1920).max(2100).describe("Earliest year"),
      limit: z.number().int().min(1).max(50).default(10).describe("Results"),
    },
    async ({ year_start, limit }) => {
      try {
        return text(await recentMedia(year_start, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "keyword_summary",
    "Aggregate keywords, centers and media types across the top results for a query.",
    {
      query: z.string().min(1).describe("Search term"),
      limit: z.number().int().min(1).max(100).default(20).describe("Records to sample"),
    },
    async ({ query, limit }) => {
      try {
        return text(await keywordSummary(query, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
