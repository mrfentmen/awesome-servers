import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  recentUrls,
  lookupUrl,
  lookupPayload,
  searchTag,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "urlhaus-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "recent_urls",
    {
      title: "Recent URLs",
      description: "Recently added malicious URLs.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 1000).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await recentUrls(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "lookup_url",
    {
      title: "Lookup URL",
      description: "Check one URL against URLhaus.",
      inputSchema: z.object({
        url: z.string().describe("Full URL.")
      }),
      annotations: READ_ONLY,
    },
    async ({ url }) => {
      try {
        return text(await lookupUrl(url));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "lookup_payload",
    {
      title: "Lookup payload",
      description: "Malware payload by SHA256.",
      inputSchema: z.object({
        sha256: z.string().describe("SHA256 hash.")
      }),
      annotations: READ_ONLY,
    },
    async ({ sha256 }) => {
      try {
        return text(await lookupPayload(sha256));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_tag",
    {
      title: "Search tag",
      description: "URLs by malware tag.",
      inputSchema: z.object({
        tag: z.string().describe("Tag, e.g. emotet."),
        limit: z.string().describe("Max results.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ tag, limit }) => {
      try {
        return text(await searchTag(tag, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}