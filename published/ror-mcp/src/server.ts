import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  organizationBatch,
  organizationDetail,
  organizationsByCountry,
  organizationsByType,
  RorError,
  searchOrganizations,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof RorError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "ror-mcp", version: "1.0.0" })

  server.tool(
    "search_organizations",
    "Search 110k+ research organizations by name or acronym, optionally in one country.",
    {
      query: z.string().min(2).describe('Name or acronym, e.g. "ETH Zurich" or "MIT"'),
      country: z.string().length(2).optional().describe('Optional 2-letter country code, e.g. "CH"'),
    },
    async ({ query, country }) => {
      try {
        return text(await searchOrganizations(query, country))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "organization_detail",
    "Full ROR record for one organization: names, aliases, location, type, links.",
    { ror_id: z.string().min(9).describe("ROR id, e.g. 042nb2s44 (or the full ror.org URL)") },
    async ({ ror_id }) => {
      try {
        return text(await organizationDetail(ror_id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "organizations_by_country",
    "A sample of ROR organizations registered in a country.",
    {
      country: z.string().length(2).describe('2-letter country code, e.g. "US"'),
      limit: z.number().int().min(1).max(50).default(10).describe("How many to return"),
    },
    async ({ country, limit }) => {
      try {
        return text(await organizationsByCountry(country, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "organizations_by_type",
    "ROR organizations of one type (education, company, government, healthcare, nonprofit, funder...), optionally in one country.",
    {
      type: z
        .enum(["education", "facility", "company", "government", "healthcare", "nonprofit", "archive", "funder", "other"])
        .describe("Organization type"),
      country: z.string().length(2).optional().describe('Optional 2-letter country code, e.g. "DE"'),
      limit: z.number().int().min(1).max(50).default(10).describe("How many to return"),
    },
    async ({ type, country, limit }) => {
      try {
        return text(await organizationsByType(type, country, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "organization_batch",
    "Look up several ROR ids at once and get a one-line summary for each.",
    {
      ror_ids: z.array(z.string().min(9)).min(1).max(10).describe("Up to 10 ROR ids"),
    },
    async ({ ror_ids }) => {
      try {
        return text(await organizationBatch(ror_ids))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
