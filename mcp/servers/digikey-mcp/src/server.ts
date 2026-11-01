import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  DigiKeyError,
  formatCategories,
  formatMedia,
  formatPricing,
  formatProduct,
  getAssociatedProducts,
  getCategories,
  getMedia,
  getPricing,
  getProductDetails,
  searchKeywords,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof DigiKeyError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const partNumber = z
  .string()
  .min(1)
  .describe("Digi-Key part number or manufacturer part number, e.g. 'Z100' or 'LM358P'")

export function createServer(): McpServer {
  const server = new McpServer({
    name: "digikey-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_keywords",
    "Search the Digi-Key catalogue by keyword (part number, description, series). " +
      "Prices are in the customer currency of the account that owns DIGIKEY_CLIENT_ID.",
    {
      keywords: z.string().min(1).describe("Search terms, e.g. 'lm358 op-amp soic'"),
      limit: z.number().int().min(1).max(50).default(10).describe("Results to return (max 50)"),
      offset: z.number().int().min(0).default(0).describe("Results to skip"),
    },
    async ({ keywords, limit, offset }) => {
      try {
        const res = await searchKeywords(keywords, limit, offset)
        const products = res.Products ?? []
        if (products.length === 0) return text(`No results for "${keywords}".`)
        const header = `${res.ProductsCount ?? products.length} matching products, showing ${products.length}:`
        return text(`${header}\n\n${products.map((p, i) => formatProduct(p, i)).join("\n\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_by_mpn",
    "Look up a single manufacturer part number precisely. Use this when you already know the MPN " +
      "and want that exact part rather than a keyword match.",
    {
      mpn: z.string().min(1).describe("Manufacturer part number, e.g. 'LM358P'"),
    },
    async ({ mpn }) => {
      try {
        const res = await searchKeywords(mpn, 5, 0)
        const products = res.Products ?? []
        if (products.length === 0) return text(`No part found for "${mpn}".`)
        const exact = products.filter(
          (p) => (p.ManufacturerProductNumber ?? "").toUpperCase() === mpn.trim().toUpperCase()
        )
        const shown = exact.length > 0 ? exact : products
        const note = exact.length > 0 ? "Exact match:" : "No exact match, closest results:"
        return text(`${note}\n\n${shown.map((p, i) => formatProduct(p, i)).join("\n\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_product_details",
    "Full details for one part: description, category, status, package variations and datasheet link.",
    { productNumber: partNumber },
    async ({ productNumber }) => {
      try {
        const res = await getProductDetails(productNumber)
        if (!res.Product) return text(`No product details for ${productNumber}.`)
        return text(formatProduct(res.Product))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_pricing",
    "Price breaks and stock levels for one part. Prices are in the account's customer currency.",
    { productNumber: partNumber },
    async ({ productNumber }) => {
      try {
        const res = await getPricing(productNumber)
        const rows = res.ProductPricings ?? []
        if (rows.length === 0) return text(`No pricing for ${productNumber}.`)
        return text(rows.map((p) => formatPricing(p)).join("\n\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_quantity_pricing",
    "Price a specific order quantity for one part, so you see the tier that applies to that quantity.",
    {
      productNumber: partNumber,
      quantity: z.number().int().min(1).describe("How many units you intend to buy"),
    },
    async ({ productNumber, quantity }) => {
      try {
        const res = await getPricing(productNumber, quantity)
        const rows = res.ProductPricings ?? []
        if (rows.length === 0) return text(`No pricing for ${productNumber} at quantity ${quantity}.`)
        return text(`Requested quantity: ${quantity}\n\n${rows.map((p) => formatPricing(p)).join("\n\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_availability",
    "Stock and lead-time summary for one part, without the full price table.",
    { productNumber: partNumber },
    async ({ productNumber }) => {
      try {
        const res = await getPricing(productNumber)
        const rows = res.ProductPricings ?? []
        if (rows.length === 0) return text(`No availability data for ${productNumber}.`)

        const lines = rows.map((p) => {
          const stock =
            p.QuantityAvailable !== undefined
              ? `in stock ${p.QuantityAvailable}`
              : "stock count not published"
          const lead = p.ManufacturerLeadWeeks ? `, manufacturer lead ${p.ManufacturerLeadWeeks} weeks` : ""
          const packages = (p.ProductVariations ?? [])
            .map((v) => `${v.PackageType?.Name ?? v.DigiKeyProductNumber ?? "variant"}: ${v.QuantityAvailableforPackageType ?? "?"}`)
            .join(" | ")
          return `${p.ManufacturerProductNumber ?? productNumber}: ${stock}${lead}${packages ? `\n  ${packages}` : ""}`
        })
        return text(lines.join("\n\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_associated_products",
    "Related parts Digi-Key lists for a product, e.g. accessories, kits and substitutes.",
    { productNumber: partNumber },
    async ({ productNumber }) => {
      try {
        const res = await getAssociatedProducts(productNumber)
        const products = res.Products ?? []
        if (products.length === 0) return text(`No associated products for ${productNumber}.`)
        return text(
          `Associated products (${res.ProductCount ?? products.length}):\n\n` +
            products.map((p, i) => formatProduct(p, i)).join("\n\n")
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_media",
    "Images, videos and other media for one part.",
    { productNumber: partNumber },
    async ({ productNumber }) => {
      try {
        const res = await getMedia(productNumber)
        return text(formatMedia(res))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_categories",
    "Top-level Digi-Key product categories with their child categories.",
    {},
    async () => {
      try {
        const res = await getCategories()
        return text(formatCategories(res))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "compare_parts",
    "Compare 2-5 parts side by side: MPN, description, category, status and starting price.",
    {
      productNumbers: z
        .array(z.string().min(1))
        .min(2)
        .max(5)
        .describe("Two to five part numbers to compare"),
    },
    async ({ productNumbers }) => {
      try {
        const rows: string[] = []
        for (const pn of productNumbers) {
          const details = await getProductDetails(pn)
          const pricing = await getPricing(pn)
          const product = details.Product
          if (!product) {
            rows.push(`${pn}: no data`)
            continue
          }
          const firstTier = (pricing.ProductPricings ?? [])
            .flatMap((p) => p.ProductVariations ?? [])
            .flatMap((v) => v.StandardPricing ?? [])[0]
          const price = firstTier ? `from ${firstTier.UnitPrice ?? "?"} @ ${firstTier.BreakQuantity ?? "?"}+` : "no price"
          rows.push(
            [
              product.ManufacturerProductNumber ?? pn,
              `  maker: ${product.Manufacturer?.Name ?? "unknown"}`,
              `  what: ${product.Description?.ProductDescription ?? "no description"}`,
              `  category: ${product.Category?.Name ?? "unknown"}`,
              `  status: ${product.Status?.Status ?? "unknown"}`,
              `  ${price}`,
            ].join("\n")
          )
        }
        return text(rows.join("\n\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
