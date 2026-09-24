import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getServiceDescription,
  getMe,
  listBrands,
  listBrandEvents,
  listBrandOrders,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "shootproof-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_service_description",
    {
      title: "Service description",
      description: "ShootProof API entry point with navigation links.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getServiceDescription());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_me",
    {
      title: "Get me",
      description: "Authenticated ShootProof user profile.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getMe());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_brands",
    {
      title: "List brands",
      description: "Photography brands on the ShootProof account.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listBrands());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_brand_events",
    {
      title: "List brand events",
      description: "Galleries (events) of a brand.",
      inputSchema: z.object({
        brand_id: z.string().describe("ShootProof brand ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ brand_id }) => {
      try {
        return text(await listBrandEvents(brand_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_brand_orders",
    {
      title: "List brand orders",
      description: "Orders of a brand.",
      inputSchema: z.object({
        brand_id: z.string().describe("ShootProof brand ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ brand_id }) => {
      try {
        return text(await listBrandOrders(brand_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}