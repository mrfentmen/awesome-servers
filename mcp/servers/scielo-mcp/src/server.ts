import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { ScieloError, article, collections, journal, journals, recentArticles } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof ScieloError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const collectionArg = z
  .string()
  .min(2)
  .default("scl")
  .describe('SciELO collection code, e.g. "scl" (Brazil), "arg" (Argentina), "mex" (Mexico)')

export function createServer(): McpServer {
  const server = new McpServer({ name: "scielo-mcp", version: "1.0.0" })

  server.tool(
    "article",
    "One SciELO article by its code: title, authors, journal, pages, keywords and abstract.",
    { code: z.string().min(10).describe('SciELO article code, e.g. "S0100-879X1998000800002"') },
    async ({ code }) => {
      try {
        return text(await article(code))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "recent_articles",
    "Newest indexed articles in a collection, with an optional indexing-date window.",
    {
      collection: collectionArg,
      limit: z.number().int().min(1).max(100).default(20).describe("How many article codes to return"),
      offset: z.number().int().min(0).default(0).describe("Skip this many articles"),
      from: z.string().optional().describe("Start of the indexing window, YYYY-MM-DD"),
      until: z.string().optional().describe("End of the indexing window, YYYY-MM-DD"),
    },
    async ({ collection, limit, offset, from, until }) => {
      try {
        return text(await recentArticles(collection, limit, offset, from, until))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "journal",
    "One SciELO journal by ISSN: title, ISSNs, publisher, collection.",
    {
      issn: z.string().min(8).describe('ISSN, e.g. "0100-879X"'),
      collection: collectionArg,
    },
    async ({ issn, collection }) => {
      try {
        return text(await journal(issn, collection))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "journals",
    "Browse the journals indexed in one collection, paginated.",
    {
      collection: collectionArg,
      limit: z.number().int().min(1).max(100).default(20).describe("How many journals to return"),
      offset: z.number().int().min(0).default(0).describe("Skip this many journals"),
    },
    async ({ collection, limit, offset }) => {
      try {
        return text(await journals(collection, limit, offset))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "collections",
    "Every SciELO collection (country and regional portals) with its code and domain.",
    {},
    async () => {
      try {
        return text(await collections())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
