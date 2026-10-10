import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { lookup, barcodeCheck } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "upcitemdb-mcp", version: "1.0.0" })
  server.registerTool(
    "lookup",
    {
      title: "Lookup",
      description: "Look up a barcode.",
      inputSchema: z.object( { upc: z.string().describe("UPC/EAN code.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await lookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "barcode_check",
    {
      title: "Barcode check",
      description: "Validate and take apart a UPC-A, EAN-13, EAN-8 or UPC-E code: the check digit recomputed against the GS1 rule, the three digit GS1 company prefix, the item reference inside it and the length class. Runs locally, no database lookup.",
      inputSchema: z.object( { upc: z.string().describe("Barcode, or several separated by commas.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await barcodeCheck(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "product_evidence",
    {
      title: "Product evidence",
      description: "Everything a plain UPCitemdb lookup leaves out: the merchant offers with their prices, conditions and shipping, the cheapest and dearest and the spread between them, the image count, the retailer identifiers and the physical attributes.",
      inputSchema: z.object( { upc: z.string().describe("Barcode, or several separated by commas."), limit: z.number().describe("Merchant listings to print, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: product_evidence ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_upcitemdb_product_evidence", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "compare_barcodes",
    {
      title: "Compare barcodes",
      description: "Look up to ten barcodes in one UPCitemdb request and set their real merchant offers against each other: cheapest priced offer per code, how many merchant domains carry it, and the gap between the cheapest and priciest of the set.",
      inputSchema: z.object( { upcs: z.string().describe("Two to ten barcodes separated by commas or spaces."), limit: z.number().describe("Merchant listings to print, 1-20.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: compare_barcodes ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_upcitemdb_compare_barcodes", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
