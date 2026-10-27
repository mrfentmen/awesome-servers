import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatDate, formatNumber, formatRelative, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "locale-format-mcp", version: "1.0.0" })

  server.tool(
    "format_number",
    "Format a number with locale grouping, currency or percent style.",
    {
      value: z.number().describe("Number to format"),
      locale: z.string().default("en-US").describe('BCP 47 locale, e.g. "de-DE", "ja-JP"'),
      style: z.enum(["decimal", "currency", "percent", "unit"]).default("decimal").describe("Format style"),
      currency: z.string().default("USD").describe("ISO 4217 code when style is currency"),
      unit: z.string().default("kilometer").describe("Unit name when style is unit"),
      decimals: z.number().int().min(0).max(6).optional().describe("Fixed fraction digits")
    },
    async (a) => {
      try {
        return text(await formatNumber(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "format_date",
    "Format an ISO date or timestamp for a locale and style.",
    {
      value: z.string().describe("ISO date or datetime, e.g. 2026-10-27T14:30:00Z"),
      locale: z.string().default("en-US").describe("BCP 47 locale"),
      style: z.enum(["short", "medium", "long", "full"]).default("medium").describe("Date style"),
      timeZone: z.string().default("UTC").describe("IANA time zone")
    },
    async (a) => {
      try {
        return text(await formatDate(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "format_relative",
    "Describe a timestamp relative to now, such as 3 days ago.",
    {
      value: z.string().describe("ISO date or datetime"),
      locale: z.string().default("en-US").describe("BCP 47 locale"),
      base: z.string().optional().describe("Reference time (default: now)")
    },
    async (a) => {
      try {
        return text(await formatRelative(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
