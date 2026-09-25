import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  search,
  details,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "nonprofit-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search",
    {
      title: "Search nonprofits",
      description: "Organizations by name.",
      inputSchema: z.object({
        query: z.string().describe("Name search.")
      }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        return text(await search(query));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "details",
    {
      title: "Org details",
      description: "Profile and filings by EIN.",
      inputSchema: z.object({
        ein: z.string().describe("9-digit EIN.")
      }),
      annotations: READ_ONLY,
    },
    async ({ ein }) => {
      try {
        return text(await details(ein));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}