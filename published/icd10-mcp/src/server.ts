import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { browseIcd10Prefix, lookupIcd10Code, searchIcd10, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "icd10-mcp", version: "1.0.0" })

  server.tool(
    "search_icd10",
    "Search ICD-10-CM codes by disease name or keyword.",
    {
      terms: z.string().min(2).describe('Search text, e.g. "type 2 diabetes"'),
      limit: z.number().int().min(1).max(50).default(10).describe("Results to return")
    },
    async (a) => {
      try {
        return text(await searchIcd10(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "lookup_icd10_code",
    "Look up the exact meaning and validity of an ICD-10-CM code.",
    {
      code: z.string().min(2).describe('Code like "E11.9" or "I10"')
    },
    async (a) => {
      try {
        return text(await lookupIcd10Code(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "browse_icd10_prefix",
    "List codes under a chapter or category prefix.",
    {
      prefix: z.string().min(1).describe('Code prefix like "E11" or "I"'),
      limit: z.number().int().min(1).max(50).default(10).describe("Results to return")
    },
    async (a) => {
      try {
        return text(await browseIcd10Prefix(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
