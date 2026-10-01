// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import * as USPS from "./usps.js"
import { postalLookup, addressGeocode } from "./api.js"
import { premiumRequired } from "./license.js"

// The tools below are registered with registerTool, which the paywall script reads,
// and that form takes annotations; the older server.tool() blocks above do not.
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
// This file has no text()/textError() helpers, so the two new blocks build their
// own results, matching the style of the older blocks above.
const text = (value: string) => ({ content: [{ type: "text", text: value }] })
const textError = (value: string) => ({ content: [{ type: "text", text: value }], isError: true })

export function createServer(): McpServer {
  const server = new McpServer({ name: "usps-mcp", version: "1.0.0" })

  server.tool(
    "get_rate",
    "Get USPS shipping rate estimate.",
    {
      destination: z.string().describe("Destination ZIP code"),
      weight: z.number().describe("Package weight in pounds"),
      service: z.string().optional().describe("Service type (default: PRIORITY)"),
    },
    async (args: any) => {
      try {
        const result = await USPS.getRate(args)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "create_label",
    "Create a USPS shipping label.",
    {
      from: z.string().describe("Sender address as JSON: {street,city,state,zip}"),
      to: z.string().describe("Recipient address as JSON: {street,city,state,zip}"),
      weight: z.number().describe("Package weight in pounds"),
      service: z.string().optional().describe("Service type (default: PRIORITY)"),
    },
    async (args: any) => {
      try {
        const from = JSON.parse(args.from)
        const to = JSON.parse(args.to)
        const result = await USPS.createLabel({ ...args, from, to })
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "track_package",
    "Track a USPS package.",
    {
      trackingNumber: z.string().describe("USPS tracking number"),
    },
    async (args: any) => {
      try {
        const result = await USPS.trackPackage(args.trackingNumber)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "validate_address",
    "Validate a USPS address.",
    {
      street: z.string().describe("Street address"),
      city: z.string().describe("City, e.g. San Francisco"),
      state: z.string().describe("Two-letter state code, e.g. CA"),
      zip: z.string().describe("ZIP code, e.g. 94107"),
    },
    async (args: any) => {
      try {
        const result = await USPS.validateAddress(args)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "get_zip_code",
    "Look up ZIP code by city and state.",
    {
      city: z.string().describe("City name, e.g. San Francisco"),
      state: z.string().describe("State abbreviation"),
    },
    async (args: any) => {
      try {
        const result = await USPS.getZipCode(args)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "get_address_info",
    "Get city/state info from ZIP code.",
    {
      zip: z.string().describe("ZIP code, e.g. 94107"),
    },
    async (args: any) => {
      try {
        const result = await USPS.getAddressInfo(args.zip)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "schedule_pickup",
    "Schedule a USPS pickup.",
    {
      street: z.string().describe("Pickup street address"),
      city: z.string().describe("Pickup city, e.g. San Francisco"),
      state: z.string().describe("Pickup state"),
      zip: z.string().describe("Pickup ZIP code"),
      packageCount: z.number().describe("Number of packages"),
    },
    async (args: any) => {
      try {
        const result = await USPS.schedulePickup({
          address: { street: args.street, city: args.city, state: args.state, zip: args.zip },
          packageCount: args.packageCount,
        })
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "get_service_standards",
    "Get delivery standards between ZIP codes.",
    {
      originZip: z.string().describe("Origin ZIP code"),
      destZip: z.string().describe("Destination ZIP code"),
    },
    async (args: any) => {
      try {
        const result = await USPS.getServiceStandards(args.originZip, args.destZip)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.registerTool(
    "postal_lookup",
    {
      title: "Postal lookup",
      description:
        "What a postcode actually covers: the country, every place under that code with their coordinates, how many distinct names it names, and whether it identifies one place or a whole city. Public postal database, no USPS key needed.",
      inputSchema: z.object({
        postcode: z.string().describe("Postcode to resolve, e.g. 90210 or SW1A 1AA"),
        country: z.string().describe("Two-letter country code to check a specific one, e.g. us or gb.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: postal_lookup ----
    const paywallMessage = await premiumRequired("postal_lookup")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await postalLookup(args)) } catch (e) { return textError(`Error: ${(e as Error).message}`) }
  }
  )

  server.registerTool(
    "address_geocode",
    {
      title: "Address geocode",
      description:
        "Resolves a typed address to coordinates with the US Census geocoder and shows the standardised form it matched, its parsed components and TIGER line; pass 'latitude, longitude' as reverse to go the other way. No USPS key needed.",
      inputSchema: z.object({
        address: z.string().describe("Address to resolve, e.g. '1600 Pennsylvania Ave NW, Washington, DC 20500'"),
        reverse: z.string().describe("Instead of an address, a 'latitude, longitude' point to resolve back to an address.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await addressGeocode(args)) } catch (e) { return textError(`Error: ${(e as Error).message}`) }
  }
  )

  return server
}
