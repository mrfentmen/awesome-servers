// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import * as USPS from "./usps.js"

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
      city: z.string().describe("City"),
      state: z.string().describe("State"),
      zip: z.string().describe("ZIP code"),
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
      city: z.string().describe("City name"),
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
      zip: z.string().describe("ZIP code"),
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
      city: z.string().describe("Pickup city"),
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

  return server
}
