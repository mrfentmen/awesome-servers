import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search_clearances, clearance_detail, clearances_by_applicant, clearances_by_product_code, clearances_by_year, clearance_stats, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "fda-510k-mcp", version: "1.0.0" })

  server.tool(
    "search_clearances",
    "Search 510(k) clearances by device name",
    {
      device: z.string().min(2).describe("Device name text, e.g. catheter or glucose meter"),
      limit: z.number().int().min(1).max(25).default(10).describe("Clearances to return")
    },
    async (a) => {
      try {
        return text(await search_clearances(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "clearance_detail",
    "One 510(k) clearance by K number",
    {
      kNumber: z.string().min(5).describe("K number, e.g. K240001")
    },
    async (a) => {
      try {
        return text(await clearance_detail(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "clearances_by_applicant",
    "510(k) clearances for one company",
    {
      applicant: z.string().min(2).describe("Company name, e.g. Medtronic"),
      limit: z.number().int().min(1).max(25).default(10).describe("Clearances to return")
    },
    async (a) => {
      try {
        return text(await clearances_by_applicant(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "clearances_by_product_code",
    "510(k) clearances under one product code",
    {
      productCode: z.string().min(2).max(5).describe("Three-letter product code, e.g. DQY"),
      limit: z.number().int().min(1).max(25).default(10).describe("Clearances to return")
    },
    async (a) => {
      try {
        return text(await clearances_by_product_code(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "clearances_by_year",
    "510(k) clearances decided in a calendar year",
    {
      year: z.number().int().min(2000).max(2030).describe("Decision year, e.g. 2025"),
      limit: z.number().int().min(1).max(25).default(10).describe("Clearances to return")
    },
    async (a) => {
      try {
        return text(await clearances_by_year(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "clearance_stats",
    "Sample counts of 510(k) decisions by advisory committee",
    {
      // no arguments
    },
    async (a) => {
      try {
        return text(await clearance_stats(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
