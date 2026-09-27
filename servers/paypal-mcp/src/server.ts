import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getOrder,
  getCapture,
  listPlans,
  planDetails,
  listProducts,
  productDetails,
  subscriptionDetails,
  payoutDetails,
  listWebhooks,
  disputeDetails,
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
      description: "One order by id, with status, amount and payer.",
      inputSchema: z.object({
        order_id: z.string().describe("PayPal order ID, e.g. 5O190127TN364715T")
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
      description: "One payment capture by id, with amount and status.",
      inputSchema: z.object({
        capture_id: z.string().describe("Capture ID from the order response")
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
      description: "Billing plans on the account, with id and status.",
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

  server.registerTool(
    "plan_details",
    {
      title: "Plan details",
      description: "Billing plan.",
      inputSchema: z.object({
        plan_id: z.string().describe("Plan ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ plan_id }) => {
      try {
        return text(await planDetails(plan_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_products",
    {
      title: "List products",
      description: "Catalog products.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listProducts());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "product_details",
    {
      title: "Product details",
      description: "Catalog product.",
      inputSchema: z.object({
        product_id: z.string().describe("Product ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ product_id }) => {
      try {
        return text(await productDetails(product_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "subscription_details",
    {
      title: "Subscription",
      description: "Subscription details.",
      inputSchema: z.object({
        subscription_id: z.string().describe("Subscription ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ subscription_id }) => {
      try {
        return text(await subscriptionDetails(subscription_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "payout_details",
    {
      title: "Payout details",
      description: "Payout batch.",
      inputSchema: z.object({
        payout_id: z.string().describe("Payout batch ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ payout_id }) => {
      try {
        return text(await payoutDetails(payout_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_webhooks",
    {
      title: "Webhooks",
      description: "Registered webhooks.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listWebhooks());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "dispute_details",
    {
      title: "Dispute details",
      description: "Customer dispute.",
      inputSchema: z.object({
        dispute_id: z.string().describe("Dispute ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ dispute_id }) => {
      try {
        return text(await disputeDetails(dispute_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}