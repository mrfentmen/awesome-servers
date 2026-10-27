import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { searchDatasets, searchProjects, searchPublications, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "openaire-mcp", version: "1.0.0" })

  server.tool(
    "search_publications",
    "Find research publications by title keywords.",
    {
      query: z.string().min(2).describe("Title keywords"),
      limit: z.number().int().min(1).max(20).default(8).describe("Results to return")
    },
    async (a) => {
      try {
        return text(await searchPublications(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_datasets",
    "Find research datasets by keyword.",
    {
      query: z.string().min(2).describe("Dataset keywords"),
      limit: z.number().int().min(1).max(20).default(8).describe("Results to return")
    },
    async (a) => {
      try {
        return text(await searchDatasets(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_projects",
    "Find funded research projects by keyword.",
    {
      query: z.string().min(2).describe("Project keywords"),
      limit: z.number().int().min(1).max(20).default(8).describe("Results to return")
    },
    async (a) => {
      try {
        return text(await searchProjects(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
