import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { labelPackages, searchLabels, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "dailymed-mcp", version: "1.0.0" })

  server.tool(
    "search_labels",
    "Find drug labels by drug name.",
    {
      drugName: z.string().min(2).describe('Drug name, e.g. "aspirin"'),
      limit: z.number().int().min(1).max(25).default(10).describe("Labels to return")
    },
    async (a) => {
      try {
        return text(await searchLabels(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "label_packages",
    "NDC codes and package details for one DailyMed label, by set id.",
    {
      setId: z.string().min(6).describe("SPL set id from search_labels"),
      limit: z.number().int().min(1).max(40).default(20).describe("Sections to return")
    },
    async (a) => {
      try {
        return text(await labelPackages(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
