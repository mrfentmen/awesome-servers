import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search_tariff, tariff_line, tariff_range, tariff_chapter, tariff_subtree, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "hts-tariff-mcp", version: "1.0.0" })

  server.tool(
    "search_tariff",
    "Search tariff descriptions by keyword",
    {
      keyword: z.string().min(2).describe("Keyword such as laptop or olive oil"),
      limit: z.number().int().min(1).max(50).default(15).describe("Maximum lines")
    },
    async (a) => {
      try {
        return text(await search_tariff(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "tariff_line",
    "One tariff line with every duty rate",
    {
      htsno: z.string().min(4).describe("Tariff number, e.g. 8471.30.01")
    },
    async (a) => {
      try {
        return text(await tariff_line(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "tariff_range",
    "Every tariff line in a numeric range",
    {
      from: z.string().min(4).describe("Range start, e.g. 8471"),
      to: z.string().min(4).describe("Range end, e.g. 8471.99"),
      limit: z.number().int().min(1).max(100).default(40).describe("Maximum lines")
    },
    async (a) => {
      try {
        return text(await tariff_range(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "tariff_chapter",
    "All lines in a two digit HTS chapter",
    {
      chapter: z.string().length(2).describe("Two digit chapter, e.g. 84"),
      limit: z.number().int().min(1).max(100).default(30).describe("Maximum lines")
    },
    async (a) => {
      try {
        return text(await tariff_chapter(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "tariff_subtree",
    "Tariff heading and everything beneath it",
    {
      prefix: z.string().min(4).max(6).describe("Heading, e.g. 8471"),
      limit: z.number().int().min(1).max(100).default(40).describe("Maximum lines")
    },
    async (a) => {
      try {
        return text(await tariff_subtree(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
