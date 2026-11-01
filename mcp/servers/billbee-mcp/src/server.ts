import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  BillbeeError,
  addOrderShipment,
  addOrderTags,
  createCustomer,
  createOrder,
  createShipmentWithLabel,
  createWebhook,
  deleteWebhook,
  findOrderByExtRef,
  getCustomer,
  getOrder,
  getProduct,
  listCustomerAddresses,
  listCustomerOrders,
  listCustomers,
  listInvoices,
  listOrderStates,
  listOrders,
  listPaymentTypes,
  listProductStocks,
  listProducts,
  listShippingCarrierEnums,
  listShippingCarriers,
  listShippingProviders,
  listWebhooks,
  patchOrder,
  patchProduct,
  sendOrderMessage,
  setOrderState,
  updateProductStock,
} from "./api.js"

const jsonBody = z.record(z.unknown())

function text(message: string) {
  return { content: [{ type: "text" as const, text: message }] }
}

function fail(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true }
}

function errorMessage(e: unknown): string {
  if (e instanceof BillbeeError) return e.message
  if (e instanceof Error) return e.message
  return String(e)
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "billbee-mcp", version: "1.0.0" })

  /* ---------------------------- orders ---------------------------- */

  server.tool(
    "list_orders",
    "List Billbee orders, newest first. Paging is 1-based; 50 per page is the API default.",
    {
      page: z.number().int().min(1).optional().describe("Page number, starting at 1"),
      pageSize: z.number().int().min(1).max(250).optional().describe("Orders per page"),
      minOrderDate: z.string().optional().describe("ISO date/time lower bound, e.g. 2026-01-01"),
      maxOrderDate: z.string().optional().describe("ISO date/time upper bound"),
      shopId: z.number().int().optional().describe("Only orders from this shop id"),
      orderStateId: z.number().int().optional().describe("Only orders in this state id"),
    },
    async ({ page, pageSize, minOrderDate, maxOrderDate, shopId, orderStateId }) => {
      try {
        return text(await listOrders({ page, pageSize, minOrderDate, maxOrderDate, shopId, orderStateId }))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_order",
    "Create an order in Billbee. The body is passed straight through as the Billbee order JSON.",
    { order: jsonBody.describe("Billbee order object (see the Billbee API docs for fields)") },
    async ({ order }) => {
      try {
        return text(await createOrder(order))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_order",
    "Fetch a single Billbee order by its internal id.",
    { id: z.number().int().describe("Billbee order id") },
    async ({ id }) => {
      try {
        return text(await getOrder(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "patch_order",
    "Patch one or more fields of an existing Billbee order. Only the fields you pass are changed.",
    {
      id: z.number().int().describe("Billbee order id"),
      patch: jsonBody.describe("Fields to update, e.g. {\"Comment\": \"...\"}"),
    },
    async ({ id, patch }) => {
      try {
        return text(await patchOrder(id, patch))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "set_order_state",
    "Change the main state of an order (and optionally notify the buyer). Use list_order_states to find state ids.",
    {
      id: z.number().int().describe("Billbee order id"),
      orderStateId: z.number().int().describe("Target order state id"),
      comment: z.string().optional().describe("Comment stored with the state change"),
      sendMail: z.boolean().optional().describe("Send the buyer an email about the change"),
      sendMessage: z.boolean().optional().describe("Send the buyer an in-platform message"),
    },
    async ({ id, orderStateId, comment, sendMail, sendMessage }) => {
      try {
        return text(await setOrderState(id, orderStateId, comment, sendMail, sendMessage))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "add_order_shipment",
    "Attach a shipment (carrier, tracking number) to an order.",
    {
      id: z.number().int().describe("Billbee order id"),
      shipment: jsonBody.describe("Billbee shipment object, e.g. {\"ProviderId\": 1, \"TrackingCode\": \"...\"}"),
    },
    async ({ id, shipment }) => {
      try {
        return text(await addOrderShipment(id, shipment))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "add_order_tags",
    "Set the tags attached to an order. This replaces the order's current tag list.",
    {
      id: z.number().int().describe("Billbee order id"),
      tags: z.array(z.string()).min(1).describe("Tag names to attach"),
    },
    async ({ id, tags }) => {
      try {
        return text(await addOrderTags(id, tags))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "send_order_message",
    "Send a message to the buyer of an order through Billbee.",
    {
      id: z.number().int().describe("Billbee order id"),
      message: jsonBody.describe("Message object, e.g. {\"Subject\": \"...\", \"Body\": \"...\"}"),
    },
    async ({ id, message }) => {
      try {
        return text(await sendOrderMessage(id, message))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_invoices",
    "List invoices created in Billbee, optionally paged.",
    {
      page: z.number().int().min(1).optional().describe("Page number"),
      pageSize: z.number().int().min(1).max(250).optional().describe("Invoices per page"),
    },
    async ({ page, pageSize }) => {
      try {
        return text(await listInvoices(page, pageSize))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "find_order_by_ext_ref",
    "Find an order by the external order number used by the connected shop.",
    { extRef: z.string().min(1).describe("External order reference / order number") },
    async ({ extRef }) => {
      try {
        return text(await findOrderByExtRef(extRef))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* --------------------------- customers -------------------------- */

  server.tool(
    "list_customers",
    "List Billbee customers with paging.",
    {
      page: z.number().int().min(1).optional().describe("Page number"),
      pageSize: z.number().int().min(1).max(250).optional().describe("Customers per page"),
    },
    async ({ page, pageSize }) => {
      try {
        return text(await listCustomers(page, pageSize))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_customer",
    "Create a customer in Billbee. The body is passed straight through as Billbee customer JSON.",
    { customer: jsonBody.describe("Billbee customer object") },
    async ({ customer }) => {
      try {
        return text(await createCustomer(customer))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_customer",
    "Fetch one Billbee customer by id.",
    { id: z.number().int().describe("Billbee customer id") },
    async ({ id }) => {
      try {
        return text(await getCustomer(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_customer_orders",
    "List the orders belonging to one customer.",
    {
      id: z.number().int().describe("Billbee customer id"),
      page: z.number().int().min(1).optional().describe("Page number"),
      pageSize: z.number().int().min(1).max(250).optional().describe("Orders per page"),
    },
    async ({ id, page, pageSize }) => {
      try {
        return text(await listCustomerOrders(id, page, pageSize))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_customer_addresses",
    "List every stored address of one customer.",
    { id: z.number().int().describe("Billbee customer id") },
    async ({ id }) => {
      try {
        return text(await listCustomerAddresses(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* ---------------------------- products -------------------------- */

  server.tool(
    "list_products",
    "List Billbee products with paging.",
    {
      page: z.number().int().min(1).optional().describe("Page number"),
      pageSize: z.number().int().min(1).max(250).optional().describe("Products per page"),
    },
    async ({ page, pageSize }) => {
      try {
        return text(await listProducts(page, pageSize))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_product",
    "Fetch one product by id, including its description.",
    { id: z.number().int().describe("Billbee product id") },
    async ({ id }) => {
      try {
        return text(await getProduct(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "patch_product",
    "Patch fields of an existing product, such as title, price or stock settings.",
    {
      id: z.number().int().describe("Billbee product id"),
      patch: jsonBody.describe("Fields to update on the product"),
    },
    async ({ id, patch }) => {
      try {
        return text(await patchProduct(id, patch))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_product_stocks",
    "List current stock levels per product.",
    {
      page: z.number().int().min(1).optional().describe("Page number"),
      pageSize: z.number().int().min(1).max(250).optional().describe("Rows per page"),
    },
    async ({ page, pageSize }) => {
      try {
        return text(await listProductStocks(page, pageSize))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_product_stock",
    "Set the current stock level of a product.",
    {
      productId: z.number().int().describe("Billbee product id"),
      stock: z.number().describe("New absolute stock level"),
      extra: jsonBody.optional().describe("Additional Billbee stock fields, e.g. {\"Reason\": \"...\"}"),
    },
    async ({ productId, stock, extra }) => {
      try {
        return text(await updateProductStock(productId, stock, extra))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* --------------------------- shipping --------------------------- */

  server.tool(
    "list_shipping_carriers",
    "List the shipping carriers configured on the account.",
    {},
    async () => {
      try {
        return text(await listShippingCarriers())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_shipping_providers",
    "List the shipping providers available for labels.",
    {},
    async () => {
      try {
        return text(await listShippingProviders())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_shipment_with_label",
    "Create a shipment and buy its label in one call.",
    { shipment: jsonBody.describe("Billbee ship-with-label request object") },
    async ({ shipment }) => {
      try {
        return text(await createShipmentWithLabel(shipment))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* --------------------------- webhooks --------------------------- */

  server.tool(
    "list_webhooks",
    "List the webhooks registered on the account.",
    {},
    async () => {
      try {
        return text(await listWebhooks())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_webhook",
    "Register a webhook. The body is passed through as Billbee webhook JSON.",
    { webhook: jsonBody.describe("Webhook object, e.g. {\"Type\": 1, \"TargetUrl\": \"https://...\"}") },
    async ({ webhook }) => {
      try {
        return text(await createWebhook(webhook))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_webhook",
    "Delete a webhook by id. This cannot be undone.",
    { id: z.number().int().describe("Webhook id") },
    async ({ id }) => {
      try {
        return text(await deleteWebhook(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* ---------------------------- enums ----------------------------- */

  server.tool(
    "list_order_states",
    "List every order state id and name defined on the account.",
    {},
    async () => {
      try {
        return text(await listOrderStates())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_payment_types",
    "List every payment type id and name defined on the account.",
    {},
    async () => {
      try {
        return text(await listPaymentTypes())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_shipping_carrier_enums",
    "List the shipping carrier enum values Billbee accepts in shipment objects.",
    {},
    async () => {
      try {
        return text(await listShippingCarrierEnums())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
