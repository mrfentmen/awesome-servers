import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  CpError,
  createShipment,
  findPostOffices,
  formatPostOffices,
  formatRates,
  formatShipment,
  formatTracking,
  getManifest,
  getPickup,
  getRates,
  getShipment,
  getShipmentArtifact,
  getShipmentDetails,
  requestPickup,
  trackPackage,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof CpError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const senderShape = {
  sender_name: z.string().describe("Sender name"),
  sender_company: z.string().optional().describe("Sender company"),
  sender_phone: z.string().optional().describe("Sender phone"),
  sender_line1: z.string().describe("Sender street address"),
  sender_city: z.string().describe("Sender city"),
  sender_province: z.string().describe("Sender province code, e.g. ON"),
  sender_postal_code: z.string().describe("Sender postal code, e.g. K1A0B1"),
}

const destinationShape = {
  destination_name: z.string().describe("Recipient name"),
  destination_company: z.string().optional().describe("Recipient company"),
  destination_phone: z.string().optional().describe("Recipient phone"),
  destination_line1: z.string().describe("Recipient street address"),
  destination_city: z.string().describe("Recipient city"),
  destination_province: z.string().describe("Recipient province code, e.g. QC"),
  destination_postal_code: z.string().describe("Recipient postal code, e.g. H2Y1C6"),
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "canadapost-mcp",
    version: "1.0.0",
  })

  server.tool(
    "get_rates",
    "Get Canada Post shipping rates between two Canadian postal codes for a parcel.",
    {
      origin_postal_code: z.string().describe("Origin postal code, e.g. K1A0B1"),
      destination_postal_code: z.string().describe("Destination postal code, e.g. H2Y1C6"),
      weight_kg: z.number().positive().describe("Parcel weight in kilograms"),
      length_cm: z.number().positive().optional().describe("Length in cm"),
      width_cm: z.number().positive().optional().describe("Width in cm"),
      height_cm: z.number().positive().optional().describe("Height in cm"),
    },
    async ({ origin_postal_code, destination_postal_code, weight_kg, length_cm, width_cm, height_cm }) => {
      try {
        const quotes = await getRates({
          originPostalCode: origin_postal_code,
          destinationPostalCode: destination_postal_code,
          weightKg: weight_kg,
          lengthCm: length_cm,
          widthCm: width_cm,
          heightCm: height_cm,
        })
        return text(formatRates(quotes, origin_postal_code, destination_postal_code))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "track_package",
    "Track a Canada Post parcel by its 16-character tracking PIN.",
    { pin: z.string().describe("Tracking PIN, e.g. 1234567890123456") },
    async ({ pin }) => {
      try {
        return text(formatTracking(await trackPackage(pin)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "find_post_offices",
    "Find Canada Post offices near a Canadian postal code.",
    {
      postal_code: z.string().describe("Postal code to search around, e.g. M5V2T6"),
      max_results: z.number().int().min(1).max(20).default(5).describe("How many offices to return"),
    },
    async ({ postal_code, max_results }) => {
      try {
        return text(formatPostOffices(await findPostOffices({ postalCode: postal_code, maxResults: max_results })))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_shipment",
    "Create a non-contract Canada Post shipment and return its shipment id and tracking pin.",
    {
      service_code: z.string().describe("Canada Post service code, e.g. DOM.EP (Expedited Parcel)"),
      weight_kg: z.number().positive().describe("Parcel weight in kilograms"),
      length_cm: z.number().positive().optional().describe("Length in cm"),
      width_cm: z.number().positive().optional().describe("Width in cm"),
      height_cm: z.number().positive().optional().describe("Height in cm"),
      reference: z.string().optional().describe("Your own customer reference"),
      ...senderShape,
      ...destinationShape,
    },
    async (args) => {
      try {
        const shipment = await createShipment({
          serviceCode: args.service_code,
          weightKg: args.weight_kg,
          lengthCm: args.length_cm,
          widthCm: args.width_cm,
          heightCm: args.height_cm,
          reference: args.reference,
          sender: {
            name: args.sender_name,
            company: args.sender_company,
            phone: args.sender_phone,
            line1: args.sender_line1,
            city: args.sender_city,
            province: args.sender_province,
            postalCode: args.sender_postal_code,
          },
          destination: {
            name: args.destination_name,
            company: args.destination_company,
            phone: args.destination_phone,
            line1: args.destination_line1,
            city: args.destination_city,
            province: args.destination_province,
            postalCode: args.destination_postal_code,
          },
        })
        return text(formatShipment(shipment))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_shipment",
    "Get the current state of a shipment you created.",
    { shipment_id: z.string().describe("Shipment id returned by create_shipment") },
    async ({ shipment_id }) => {
      try {
        return text(formatShipment(await getShipment(shipment_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_shipment_details",
    "Get full delivery details for a shipment, including links to its artifacts.",
    { shipment_id: z.string().describe("Shipment id returned by create_shipment") },
    async ({ shipment_id }) => {
      try {
        return text(formatShipment(await getShipmentDetails(shipment_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_label",
    "Fetch a shipping artifact for a shipment. Returns the PDF size and content type; the file itself is not inlined.",
    {
      shipment_id: z.string().describe("Shipment id returned by create_shipment"),
      artifact_type: z
        .enum(["label", "manifest", "receipt"])
        .default("label")
        .describe("Artifact to request"),
    },
    async ({ shipment_id, artifact_type }) => {
      try {
        const artifact = await getShipmentArtifact(shipment_id, artifact_type)
        return text(
          `${artifact_type} for shipment ${shipment_id}: ${artifact.bytes} bytes (${artifact.contentType})`
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_manifest",
    "Get the manifest (end-of-day pickup summary) for a date range.",
    {
      start_date: z.string().describe("Start date as YYYYMMDD"),
      end_date: z.string().describe("End date as YYYYMMDD"),
    },
    async ({ start_date, end_date }) => {
      try {
        const manifest = await getManifest(start_date, end_date)
        const links = manifest.links.map((link) => `${link.rel} -> ${link.href}`).join("; ")
        return text(
          `Manifest ${start_date}-${end_date}: ${manifest.poNumber ?? "no PO number"}${links ? `\nLinks: ${links}` : ""}`
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "request_pickup",
    "Book a Canada Post pickup at a business address.",
    {
      pickup_type: z.enum(["Station", "OnDemand", "OnDemandPremium"]).describe("Pickup service level"),
      name: z.string().describe("Business name"),
      company: z.string().optional().describe("Company name if different"),
      phone: z.string().describe("Contact phone"),
      line1: z.string().describe("Street address"),
      city: z.string().describe("City"),
      province: z.string().describe("Province code, e.g. ON"),
      postal_code: z.string().describe("Postal code"),
      pickup_date: z.string().describe("Pickup date as YYYY-MM-DD"),
      ready_time: z.string().describe("Earliest ready time as HH:MM"),
      close_time: z.string().describe("Latest close time as HH:MM"),
      instructions: z.string().optional().describe("Special instructions for the courier"),
    },
    async (args) => {
      try {
        const pickup = await requestPickup({
          pickupType: args.pickup_type,
          name: args.name,
          company: args.company,
          phone: args.phone,
          line1: args.line1,
          city: args.city,
          province: args.province,
          postalCode: args.postal_code,
          pickupDate: args.pickup_date,
          readyTime: args.ready_time,
          closeTime: args.close_time,
          instructions: args.instructions,
        })
        return text(`Pickup requested. Id: ${pickup.pickupId ?? "not returned"}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_pickup",
    "Get the status of a booked pickup.",
    { pickup_id: z.string().describe("Pickup id returned by request_pickup") },
    async ({ pickup_id }) => {
      try {
        const pickup = await getPickup(pickup_id)
        return text(`Pickup ${pickup.pickupId ?? pickup_id}: ${pickup.status ?? "status not published"}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
