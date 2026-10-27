import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { searchSpecies, speciesChildren, speciesClassification, speciesRecord, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "worms-mcp", version: "1.0.0" })

  server.tool(
    "search_species",
    "Find marine species by scientific name.",
    {
      name: z.string().min(2).describe('Scientific name, e.g. "Gadus morhua"'),
      limit: z.number().int().min(1).max(25).default(8).describe("Results to return")
    },
    async (a) => {
      try {
        return text(await searchSpecies(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "species_record",
    "Read one WoRMS record by AphiaID.",
    {
      aphiaId: z.number().int().positive().describe("WoRMS AphiaID, e.g. 126436")
    },
    async (a) => {
      try {
        return text(await speciesRecord(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "species_children",
    "Direct children of a taxon.",
    {
      aphiaId: z.number().int().positive().describe("Parent AphiaID"),
      limit: z.number().int().min(1).max(50).default(10).describe("Children to return")
    },
    async (a) => {
      try {
        return text(await speciesChildren(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "species_classification",
    "Full taxonomic classification from kingdom to species.",
    {
      aphiaId: z.number().int().positive().describe("WoRMS AphiaID")
    },
    async (a) => {
      try {
        return text(await speciesClassification(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
