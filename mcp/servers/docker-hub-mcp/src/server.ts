import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { imageInfo, searchImages, namespaceRepositories } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "docker-hub-mcp", version: "1.0.0" })
  server.registerTool(
    "image_info",
    {
      title: "Image info",
      description: "Get details for a Docker image.",
      inputSchema: z.object( { name: z.string().describe("Image name like library/nginx.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await imageInfo(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "search_images",
    {
      title: "Search images",
      description: "Search Docker Hub images.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchImages(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "tag_list",
    {
      title: "Tag list",
      description: "Every tag of a Docker image with its platforms, per platform sizes and last push dates.",
      inputSchema: z.object( { name: z.string().describe("Image name like library/nginx."), limit: z.number().describe("Tags to show, 1-100. Defaults to 25.").optional(), sort: z.string().describe("last_updated or name. Defaults to last_updated.").optional(), page: z.number().describe("Page number, starting at 1.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement list locally (paywall removed)
    try { return textError("Not yet implemented: list") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "namespace_repositories",
    {
      title: "Namespace repositories",
      description: "Every repository under one Docker Hub namespace, with pull counts, stars and last update.",
      inputSchema: z.object( { namespace: z.string().describe("Namespace, like library for official images or bitnami."), limit: z.number().describe("Repositories to show, 1-100. Defaults to 25.").optional(), sort: z.string().describe("pull_count, last_updated or name. Defaults to pull_count.").optional(), page: z.number().describe("Page number, starting at 1.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await namespaceRepositories(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "tag_platforms",
    {
      title: "Tag platforms",
      description: "The platform images behind one tag, with the immutable digest to pin for each architecture.",
      inputSchema: z.object( { name: z.string().describe("Image name like library/nginx."), tag: z.string().describe("Tag, like 1.27 or stable-alpine.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement platforms locally (paywall removed)
    try { return textError("Not yet implemented: platforms") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
