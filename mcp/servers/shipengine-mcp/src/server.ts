import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  cancelShipment,
  createLabel,
  createShipment,
  estimateRates,
  getBatch,
  getCarrier,
  getRate,
  getRates,
  getShipment,
  getShipmentRates,
  listBatches,
  listCarrierPackages,
  listCarrierServices,
  listCarriers,
  listLabels,
  listShipments,
  listWarehouses,
  recognizeAddress,
  trackLabel,
  trackPackage,
  validateAddress,
  voidLabel,
  formatAddress,
  formatBatch,
  formatCarrier,
  formatCarrierService,
  formatLabel,
  formatPackageType,
  formatRate,
  formatShipment,
  formatTracking,
  formatWarehouse,
} from "./api.js"

function text(s: string) {
  return { content: [{ type: "text" as const, text: s }] }
}

function fail(message: string) {
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true }
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

function numbered(lines: string[], empty: string): string {
  if (lines.length === 0) return empty
  return lines.map((line, i) => `${i + 1}. ${line}`).join("\n")
}

const jsonBody = z.record(z.unknown())

export function createServer(): McpServer {
  const server = new McpServer({ name: "shipengine-mcp", version: "1.0.0" })

  server.tool("list_carriers", "List the carrier accounts connected to this ShipEngine account, with balance and account number.", {}, async () => {
    try {
      return text(numbered((await listCarriers()).map(formatCarrier), "No carriers are connected to this ShipEngine account."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("get_carrier", "Get one carrier account by its ShipEngine carrier id.", { carrier_id: z.string().describe("ShipEngine carrier id, e.g. se-123456") }, async ({ carrier_id }) => {
    try {
      return text(formatCarrier(await getCarrier(carrier_id)))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("list_carrier_services", "List the shipping services a carrier account offers (ground, express, international...).", { carrier_id: z.string().describe("ShipEngine carrier id") }, async ({ carrier_id }) => {
    try {
      return text(numbered((await listCarrierServices(carrier_id)).map(formatCarrierService), "This carrier reports no services."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("list_carrier_packages", "List the package types a carrier account accepts.", { carrier_id: z.string().describe("ShipEngine carrier id") }, async ({ carrier_id }) => {
    try {
      return text(numbered((await listCarrierPackages(carrier_id)).map(formatPackageType), "This carrier reports no package types."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "validate_address",
    "Validate one or more US/international addresses and get ShipEngine's normalized version plus status messages.",
    { addresses: z.array(jsonBody).min(1).describe("Array of ShipEngine address objects, e.g. [{ name, address_line1, city_locality, state_province, postal_code, country_code }]") },
    async ({ addresses }) => {
      try {
        return text(numbered((await validateAddress(addresses)).map(formatAddress), "ShipEngine returned no addresses."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "recognize_address",
    "Parse a free-form address string into structured address fields.",
    { address: jsonBody.describe("ShipEngine recognize request body, e.g. { text: '525 S Winchester Blvd, San Jose, CA 95128' }") },
    async ({ address }) => {
      try {
        return text(formatAddress(await recognizeAddress(address)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "get_rates",
    "Quote live shipping rates for a shipment across the connected carriers.",
    { shipment: jsonBody.describe("ShipEngine rate request body: shipment_id, or ship_to/ship_from/packages/weight details") },
    async ({ shipment }) => {
      try {
        return text(numbered((await getRates(shipment)).map(formatRate), "No rates were returned for this shipment."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "estimate_rates",
    "Estimate rates without creating a shipment, from carrier, service, addresses and package weight.",
    { request: jsonBody.describe("ShipEngine estimate body: carrier_ids, from_*, to_*, weight, dimensions where known") },
    async ({ request }) => {
      try {
        return text(numbered((await estimateRates(request)).map(formatRate), "No estimated rates were returned."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool("get_rate", "Look up a single quoted rate by its rate id.", { rate_id: z.string().describe("Rate id from get_rates or estimate_rates") }, async ({ rate_id }) => {
    try {
      return text(formatRate(await getRate(rate_id)))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "list_shipments",
    "List shipments in the account, newest first.",
    { page: z.number().int().min(1).optional().describe("Page number, starting at 1"), page_size: z.number().int().min(1).max(100).optional().describe("Results per page (max 100)") },
    async ({ page, page_size }) => {
      try {
        return text(numbered((await listShipments(page, page_size)).map(formatShipment), "No shipments found."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "create_shipment",
    "Create a shipment record from a carrier, service, addresses, packages and optional label options.",
    { shipment: jsonBody.describe("ShipEngine shipment body: carrier_id, service_code, ship_to, ship_from, packages[] as defined by their OpenAPI spec") },
    async ({ shipment }) => {
      try {
        return text(formatShipment(await createShipment(shipment)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool("get_shipment", "Get one shipment by its ShipEngine shipment id.", { shipment_id: z.string().describe("ShipEngine shipment id") }, async ({ shipment_id }) => {
    try {
      return text(formatShipment(await getShipment(shipment_id)))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "cancel_shipment",
    "Cancel a shipment that has not been labelled yet. This is destructive: the shipment cannot be restored afterwards.",
    { shipment_id: z.string().describe("ShipEngine shipment id") },
    async ({ shipment_id }) => {
      try {
        return text(`Cancelled.\n${formatShipment(await cancelShipment(shipment_id))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool("get_shipment_rates", "List the rates already quoted for an existing shipment.", { shipment_id: z.string().describe("ShipEngine shipment id") }, async ({ shipment_id }) => {
    try {
      return text(numbered((await getShipmentRates(shipment_id)).map(formatRate), "This shipment has no rates."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "list_labels",
    "List purchased labels in the account.",
    { page: z.number().int().min(1).optional().describe("Page number, starting at 1"), page_size: z.number().int().min(1).max(100).optional().describe("Results per page (max 100)") },
    async ({ page, page_size }) => {
      try {
        return text(numbered((await listLabels(page, page_size)).map(formatLabel), "No labels found."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "create_label",
    "Purchase a label. This spends real money on the connected carrier account.",
    { label: jsonBody.describe("ShipEngine label body: shipment, or shipment_id/rate_id plus label_format, label_layout and label_download_type") },
    async ({ label }) => {
      try {
        return text(formatLabel(await createLabel(label)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool("track_label", "Get tracking status and event history for a purchased label.", { label_id: z.string().describe("ShipEngine label id") }, async ({ label_id }) => {
    try {
      return text(formatTracking(await trackLabel(label_id)))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "void_label",
    "Void a purchased label so it cannot be used. This is destructive and may be refused by the carrier after the void window closes.",
    { label_id: z.string().describe("ShipEngine label id") },
    async ({ label_id }) => {
      try {
        return text(`Voided.\n${formatLabel(await voidLabel(label_id))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "track_package",
    "Track any package by carrier code and tracking number, without needing a ShipEngine label.",
    {
      carrier_code: z.string().describe("ShipEngine carrier code, e.g. ups, fedex, usps, dhl_express"),
      tracking_number: z.string().describe("Carrier tracking number"),
    },
    async ({ carrier_code, tracking_number }) => {
      try {
        return text(formatTracking(await trackPackage(carrier_code, tracking_number)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool("list_warehouses", "List the warehouses (ship-from locations) configured in the account.", {}, async () => {
    try {
      return text(numbered((await listWarehouses()).map(formatWarehouse), "No warehouses configured."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "list_batches",
    "List label batches in the account.",
    { page: z.number().int().min(1).optional().describe("Page number, starting at 1"), page_size: z.number().int().min(1).max(100).optional().describe("Results per page (max 100)") },
    async ({ page, page_size }) => {
      try {
        return text(numbered((await listBatches(page, page_size)).map(formatBatch), "No batches found."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool("get_batch", "Get one label batch by its batch id, including processing errors.", { batch_id: z.string().describe("ShipEngine batch id") }, async ({ batch_id }) => {
    try {
      return text(formatBatch(await getBatch(batch_id)))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  return server
}
