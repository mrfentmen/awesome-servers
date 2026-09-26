import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  search,
  listUsers,
  getPage,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "notion-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Pages and databases the integration can reach, by title.",
      inputSchema: z.object({
        query: z.string().describe("Search text.")
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
    "list_users",
    {
      title: "List users",
      description: "Users in the Notion workspace, with id, name and type.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listUsers());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_page",
    {
      title: "Get page",
      description: "Properties of one page, by the page id.",
      inputSchema: z.object({
        page_id: z.string().describe("Page ID, e.g. 8a1b2c3d4e5f67890a1b2c3d4e5f6789")
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

  return server
}