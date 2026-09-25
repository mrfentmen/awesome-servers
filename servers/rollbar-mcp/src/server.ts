import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listProjects,
  listItems,
  getItem,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "rollbar-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description: "Rollbar projects.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listProjects());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_items",
    {
      title: "List items",
      description: "Error items in a project.",
      inputSchema: z.object({
        project_id: z.string().describe("Project ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await listItems(project_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_item",
    {
      title: "Get item",
      description: "Error item details.",
      inputSchema: z.object({
        project_id: z.string().describe("Project ID."),
        item_id: z.string().describe("Item ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id, item_id }) => {
      try {
        return text(await getItem(project_id, item_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}