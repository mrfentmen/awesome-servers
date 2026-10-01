// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import * as Invoice from "./invoice.js"
import { vatNumberCheck, ibanCheck, currencyReference } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const errorMessage = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

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
      carrier: z.enum(["UPS", "USPS", "FEDEX", "DHL"]).describe("Carrier code, e.g. UPS"),
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
      carrier: z.enum(["UPS", "USPS", "FEDEX", "DHL"]).describe("Carrier code, e.g. UPS"),
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

  server.registerTool(
    "vat_number_check",
    {
      title: "VAT number check",
      description: "Validate a VAT or TVA number with the checksum its country actually uses - MOD 11-2 for most EU states, the weighted 97 rule for the UK - and warn when the national part is the wrong length.",
      inputSchema: z.object({ vat_number: z.string().describe("VAT number with or without its country prefix, e.g. DE123456789") }),
    },
    async (args: any) => {
      // ---- paywall: vat_number_check ----
      const paywallMessage = await premiumRequired("vat_number_check")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await vatNumberCheck(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "iban_check",
    {
      title: "IBAN check",
      description: "Validate an IBAN with the ISO 7064 mod 97-10 checksum, check its length against the country table, and pull out the bank identifier and account tail.",
      inputSchema: z.object({ iban: z.string().describe("IBAN, spaces allowed, e.g. DE89 3704 0044 0532 0130 00") }),
    },
    async (args: any) => {
      // ---- paywall: iban_check ----
      const paywallMessage = await premiumRequired("iban_check")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await ibanCheck(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "currency_reference",
    {
      title: "Currency reference",
      description: "Convert an invoice total with today's ECB reference rate, reporting the rate, the rate date and the converted figure, for quoting a foreign-currency invoice.",
      inputSchema: z.object({ amount: z.number().describe("Invoice total to convert"), from: z.string().describe("Three-letter source currency, e.g. USD"), to: z.string().describe("Three-letter target currency, e.g. EUR") }),
    },
    async (args: any) => {
      // ---- paywall: currency_reference ----
      const paywallMessage = await premiumRequired("currency_reference")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await currencyReference(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}
