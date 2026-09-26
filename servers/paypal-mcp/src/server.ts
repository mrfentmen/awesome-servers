import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getOrder,
  getCapture,
  listPlans,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "paypal-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_order",
    {
      title: "Get order",
      description: "Order details.",
      inputSchema: z.object({
        order_id: z.string().describe("Order ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ order_id }) => {
      try {
        return text(await getOrder(order_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_capture",
    {
      title: "Get capture",
      description: "Capture details.",
      inputSchema: z.object({
        capture_id: z.string().describe("Capture ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ capture_id }) => {
      try {
        return text(await getCapture(capture_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_plans",
    {
      title: "List plans",
      description: "Billing plans.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listPlans());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}