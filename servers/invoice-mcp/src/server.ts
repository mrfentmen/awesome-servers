// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import * as Invoice from "./invoice.js"

export function createServer(): McpServer {
  const server = new McpServer({ name: "invoice-mcp", version: "1.0.0" })

  server.tool(
    "generate_invoice",
    "Generate an HTML invoice from invoice data.",
    {
      data: z.string().describe("JSON object with from, to, items, currency"),
    },
    async (args: any) => {
      try {
        const data = JSON.parse(args.data)
        const path = await Invoice.generateInvoice(data)
        return { content: [{ type: "text", text: `Invoice generated at: ${path}` }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "convert_to_pdf",
    "Convert HTML invoice to PDF.",
    {
      htmlPath: z.string().describe("Path to HTML invoice file"),
      outputPath: z.string().optional().describe("Output PDF path"),
    },
    async (args: any) => {
      try {
        const outputPath = args.outputPath || args.htmlPath.replace(".html", ".pdf")
        const path = await Invoice.convertToPdf(args.htmlPath, outputPath)
        return { content: [{ type: "text", text: `PDF saved to: ${path}` }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "send_invoice",
    "Send invoice via carrier API.",
    {
      pdfPath: z.string().describe("Path to PDF invoice"),
      carrier: z.enum(["UPS", "USPS", "FEDEX", "DHL"]).describe("Carrier to send via"),
      trackNumber: z.string().optional().describe("Tracking number for existing shipment"),
    },
    async (args: any) => {
      try {
        const result = await Invoice.sendInvoiceViaCarrier(args.pdfPath, args.carrier, args.trackNumber)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "validate_address",
    "Validate address for a specific carrier.",
    {
      address: z.string().describe("Address to validate"),
      carrier: z.enum(["UPS", "USPS", "FEDEX", "DHL"]).describe("Carrier for validation"),
    },
    async (args: any) => {
      try {
        const valid = await Invoice.validateAddress(args.address, args.carrier)
        return { content: [{ type: "text", text: `Address valid: ${valid}` }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "create_label",
    "Create shipping label for an invoice.",
    {
      from: z.string().describe("Sender address"),
      to: z.string().describe("Recipient address"),
      weight: z.number().describe("Package weight"),
      service: z.string().describe("Service level (e.g., ground, express)"),
      carrier: z.enum(["UPS", "USPS", "FEDEX", "DHL"]).describe("Carrier"),
    },
    async (args: any) => {
      try {
        const result = await Invoice.createLabel(
          { from: args.from, to: args.to, weight: args.weight, service: args.service },
          args.carrier,
        )
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "track_shipment",
    "Track a shipment with carrier API.",
    {
      carrier: z.enum(["UPS", "USPS", "FEDEX", "DHL"]).describe("Carrier"),
      trackNumber: z.string().describe("Tracking number"),
    },
    async (args: any) => {
      try {
        const result = await Invoice.trackShipment(args.carrier, args.trackNumber)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool("list_carriers", "List supported carriers.", {}, async () => {
    try {
      const carriers = Invoice.listCarriers()
      return { content: [{ type: "text", text: JSON.stringify(carriers, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  return server
}
