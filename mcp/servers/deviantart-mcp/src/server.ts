import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  browseHot,
  browseNewest,
  searchTags,
  getDeviation,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "deviantart-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "browse_hot",
    {
      title: "Browse hot art",
      description: "Currently hot DeviantArt deviations with authors and stats.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await browseHot());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "browse_newest",
    {
      title: "Browse newest",
      description: "Newest DeviantArt deviations across the site.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await browseNewest());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_tags",
    {
      title: "Search by tag",
      description: "DeviantArt deviations tagged with a word.",
      inputSchema: z.object({
        tag: z.string().describe("Tag, e.g. 'dragon'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ tag }) => {
      try {
        return text(await searchTags(tag));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_deviation",
    {
      title: "Get deviation metadata",
      description: "Metadata for DeviantArt deviations by id.",
      inputSchema: z.object({
        deviationIds: z.string().describe("Comma-separated deviation ids"),
      }),
      annotations: READ_ONLY,
    },
    async ({ deviationIds }) => {
      try {
        return text(await getDeviation(deviationIds));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
