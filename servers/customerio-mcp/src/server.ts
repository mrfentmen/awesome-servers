import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listCustomers,
  getCustomer,
  listSegments,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "customerio-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_customers",
    {
      title: "List customers",
      description: "Tracked customers with email and attributes.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listCustomers(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_customer",
    {
      title: "Get customer",
      description: "One customer profile by id, with its attributes.",
      inputSchema: z.object({
        identifier: z.string().describe("ID or email.")
      }),
      annotations: READ_ONLY,
    },
    async ({ identifier }) => {
      try {
        return text(await getCustomer(identifier));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_segments",
    {
      title: "List segments",
      description: "Segments with id, name and member counts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listSegments());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}