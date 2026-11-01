import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  AusPostError,
  calculateDomesticPostage,
  cancelOrder,
  createLabel,
  createOrder,
  createOrderLabels,
  formatLabel,
  formatOrder,
  formatOrderList,
  formatQuote,
  formatServices,
  formatTracking,
  getLabel,
  getLabelDetails,
  getOrder,
  getOrderSummary,
  listDomesticServices,
  listLabels,
  listOrders,
  trackItems,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof AusPostError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

function parseBody(raw: string, label: string): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new AusPostError(`${label} must be valid JSON.`)
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new AusPostError(`${label} must be a JSON object.`)
  }
  return parsed as Record<string, unknown>
}

const parcelShape = {
  from_postcode: z.string().describe("Origin postcode, e.g. '2000'"),
  to_postcode: z.string().describe("Destination postcode, e.g. '3000'"),
  length: z.number().positive().describe("Parcel length in centimetres"),
  width: z.number().positive().describe("Parcel width in centimetres"),
  height: z.number().positive().describe("Parcel height in centimetres"),
  weight: z.number().positive().describe("Parcel weight in kilograms"),
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "auspost-mcp",
    version: "1.0.0",
  })

  server.tool(
    "track_items",
    "Track one or more Australia Post items by tracking id.",
    {
      tracking_ids: z
        .array(z.string())
        .min(1)
        .describe("Tracking ids, e.g. ['33ABC12345678901234567']"),
    },
    async ({ tracking_ids }) => {
      try {
        return text(formatTracking(await trackItems(tracking_ids)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_order",
    "Create a shipping order. Pass the order body as JSON, matching the " +
      "Australia Post Shipping API order schema (order_reference, " +
      "customer_reference, items with item_reference, length, width, height, " +
      "weight, and addresses).",
    {
      order: z.string().describe("Order body as a JSON object string"),
    },
    async ({ order }) => {
      try {
        return text(formatOrder(await createOrder(parseBody(order, "order"))))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_orders",
    "List shipping orders, newest first.",
    {
      page: z.number().int().min(1).optional().describe("Page number"),
      per_page: z.number().int().min(1).max(100).optional().describe("Orders per page"),
      status: z.string().optional().describe("Filter by order status"),
    },
    async ({ page, per_page, status }) => {
      try {
        return text(formatOrderList(await listOrders({ page, perPage: per_page, status })))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_order",
    "Get one shipping order by id.",
    { order_id: z.string().describe("Order id returned by create_order") },
    async ({ order_id }) => {
      try {
        return text(formatOrder(await getOrder(order_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_order_summary",
    "Get the summary block for an order: charges, item counts and status.",
    { order_id: z.string().describe("Order id") },
    async ({ order_id }) => {
      try {
        return text(JSON.stringify(await getOrderSummary(order_id), null, 2))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "cancel_order",
    "Cancel an order that has not shipped yet.",
    { order_id: z.string().describe("Order id") },
    async ({ order_id }) => {
      try {
        const result = await cancelOrder(order_id)
        return text(Object.keys(result).length > 0 ? JSON.stringify(result, null, 2) : `Order ${order_id} cancelled.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_label",
    "Create a shipping label. Pass the label body as JSON matching the " +
      "Shipping API label schema (label_reference, order_id or preferences).",
    { label: z.string().describe("Label body as a JSON object string") },
    async ({ label }) => {
      try {
        return text(formatLabel(await createLabel(parseBody(label, "label"))))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_label",
    "Get a label record by id.",
    { label_id: z.string().describe("Label id") },
    async ({ label_id }) => {
      try {
        return text(formatLabel(await getLabel(label_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_label_details",
    "Get the full label payload: print URLs, article barcodes and tracking ids.",
    { label_id: z.string().describe("Label id") },
    async ({ label_id }) => {
      try {
        return text(JSON.stringify(await getLabelDetails(label_id), null, 2))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_labels",
    "List shipping labels.",
    {
      page: z.number().int().min(1).optional().describe("Page number"),
      per_page: z.number().int().min(1).max(100).optional().describe("Labels per page"),
    },
    async ({ page, per_page }) => {
      try {
        const result = await listLabels({ page, perPage: per_page })
        const labels = result.labels ?? []
        return text(
          labels.length === 0
            ? `No labels returned.`
            : [`${labels.length} label(s):`, ...labels.map((l, i) => `${i + 1}. ${formatLabel(l)}`)].join("\n")
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_order_labels",
    "Create label(s) directly from an existing order id.",
    {
      order_id: z.string().describe("Order id to label"),
      preferences: z.string().optional().describe("Optional JSON body with label preferences"),
    },
    async ({ order_id, preferences }) => {
      try {
        const body = preferences ? parseBody(preferences, "preferences") : {}
        return text(formatLabel(await createOrderLabels(order_id, body)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_domestic_services",
    "List available domestic parcel services and prices for a parcel. " +
      "Weight is in kilograms, dimensions in centimetres.",
    parcelShape,
    async (input) => {
      try {
        return text(
          formatServices(
            await listDomesticServices({
              fromPostcode: input.from_postcode,
              toPostcode: input.to_postcode,
              length: input.length,
              width: input.width,
              height: input.height,
              weight: input.weight,
            })
          )
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "calculate_domestic_postage",
    "Get the exact price for one domestic service code for a parcel.",
    {
      ...parcelShape,
      service_code: z.string().describe("Service code from list_domestic_services, e.g. 'AUS_PARCEL_REGULAR'"),
    },
    async (input) => {
      try {
        return text(
          formatQuote(
            await calculateDomesticPostage({
              fromPostcode: input.from_postcode,
              toPostcode: input.to_postcode,
              length: input.length,
              width: input.width,
              height: input.height,
              weight: input.weight,
              serviceCode: input.service_code,
            })
          )
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
