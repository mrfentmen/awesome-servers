import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { companyDetail, companyRoles, searchCompanies, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "brreg-mcp", version: "1.0.0" })

  server.tool(
    "search_companies",
    "Search Norwegian registered entities by name.",
    {
      name: z.string().min(2).describe('Company name or part, e.g. "Equinor"'),
      limit: z.number().int().min(1).max(25).default(8).describe("Results to return")
    },
    async (a) => {
      try {
        return text(await searchCompanies(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "company_detail",
    "Read a company by organisation number.",
    {
      orgNumber: z.string().regex(/^\d{9}$/).describe("9-digit organisation number")
    },
    async (a) => {
      try {
        return text(await companyDetail(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "company_roles",
    "Board members, CEO and other registered roles.",
    {
      orgNumber: z.string().regex(/^\d{9}$/).describe("9-digit organisation number")
    },
    async (a) => {
      try {
        return text(await companyRoles(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
