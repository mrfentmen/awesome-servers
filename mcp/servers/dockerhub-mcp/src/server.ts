import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  compareImages,
  DockerHubError,
  imageDetails,
  imageTags,
  officialImages,
  searchImages,
  tagInfo,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof DockerHubError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "dockerhub-mcp", version: "1.0.0" })

  server.tool(
    "search_images",
    "Search Docker Hub images by keyword, with stars and pull counts.",
    {
      query: z.string().min(1).describe("Search term, e.g. postgres"),
      limit: z.number().int().min(1).max(50).default(10).describe("Results"),
    },
    async ({ query, limit }) => {
      try {
        return text(await searchImages(query, limit))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "image_details",
    "Description, stars, pulls and status for one image (namespace/name; official images accept just the name).",
    { ref: z.string().min(1).describe("e.g. library/nginx or nginx") },
    async ({ ref }) => {
      try {
        return text(await imageDetails(ref))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "image_tags",
    "List an image's tags, with size, architectures and update date.",
    {
      ref: z.string().min(1).describe("e.g. library/nginx"),
      limit: z.number().int().min(1).max(100).default(20).describe("Tags to return"),
      ordering: z
        .enum(["last_updated", "-last_updated", "name", "-name"])
        .default("last_updated")
        .describe("Sort order: last_updated = newest first, -last_updated = oldest first"),
    },
    async ({ ref, limit, ordering }) => {
      try {
        return text(await imageTags(ref, limit, ordering))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "official_images",
    "Official Docker images ranked by pull count.",
    { limit: z.number().int().min(1).max(100).default(20).describe("Images to return") },
    async ({ limit }) => {
      try {
        return text(await officialImages(limit))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "tag_info",
    "Digest, compressed and full size, and per-architecture manifests for a single tag.",
    {
      ref: z.string().min(1).describe("e.g. library/nginx"),
      tag: z.string().min(1).describe("Tag name, e.g. 1.27-alpine"),
    },
    async ({ ref, tag }) => {
      try {
        return text(await tagInfo(ref, tag))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "compare_images",
    "Side-by-side stars, update date and official status for two images.",
    {
      first: z.string().min(1).describe("First image, e.g. library/nginx"),
      second: z.string().min(1).describe("Second image, e.g. library/caddy"),
    },
    async ({ first, second }) => {
      try {
        return text(await compareImages(first, second))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
