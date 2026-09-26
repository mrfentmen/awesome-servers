import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listPages,
  getPage,
  listIncidents,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "statuspage-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_pages",
    {
      title: "List pages",
      description: "Status pages.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listPages());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_page",
    {
      title: "Get page",
      description: "Page details.",
      inputSchema: z.object({
        page_id: z.string().describe("Statuspage page ID, e.g. 1a2b3c4d5e6f")
      }),
      annotations: READ_ONLY,
    },
    async ({ page_id }) => {
      try {
        return text(await getPage(page_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_incidents",
    {
      title: "List incidents",
      description: "Recent incidents.",
      inputSchema: z.object({
        page_id: z.string().describe("Statuspage page ID, e.g. 1a2b3c4d5e6f")
      }),
      annotations: READ_ONLY,
    },
    async ({ page_id }) => {
      try {
        return text(await listIncidents(page_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}