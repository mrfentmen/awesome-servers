import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { projectDetail, searchProjects, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "pride-mcp", version: "1.0.0" })

  server.tool(
    "search_projects",
    "Search PRIDE proteomics projects by keyword.",
    {
      keyword: z.string().min(2).describe('Keyword, e.g. "single cell"'),
      limit: z.number().int().min(1).max(25).default(8).describe("Projects to return")
    },
    async (a) => {
      try {
        return text(await searchProjects(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "project_detail",
    "Read one PRIDE project, its methods and instruments.",
    {
      accession: z.string().regex(/^PXD\d{6,9}$/).describe('PRIDE accession like "PXD001357"')
    },
    async (a) => {
      try {
        return text(await projectDetail(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
