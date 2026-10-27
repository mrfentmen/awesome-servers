import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { occurrences, taxonChildren, taxonInfo, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "obis-mcp", version: "1.0.0" })

  server.tool(
    "taxon_info",
    "Look up a marine taxon by scientific name or OBIS taxon ID.",
    {
      name: z.string().min(2).describe('Scientific name, e.g. "Gadus morhua"')
    },
    async (a) => {
      try {
        return text(await taxonInfo(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "taxon_children",
    "Immediate children of a taxon in the OBIS backbone.",
    {
      taxonId: z.number().int().positive().describe("OBIS taxon ID, e.g. 126436 for Atlantic cod")
    },
    async (a) => {
      try {
        return text(await taxonChildren(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "occurrences",
    "Occurrence records for a taxon, with dataset, depth and coordinates.",
    {
      taxonId: z.number().int().positive().optional().describe("OBIS taxon ID"),
      scientificName: z.string().min(2).optional().describe("Scientific name, alternative to taxonId"),
      limit: z.number().int().min(1).max(50).default(10).describe("Records to return")
    },
    async (a) => {
      try {
        return text(await occurrences(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
