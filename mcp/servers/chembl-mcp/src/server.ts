import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { moleculeDetail, searchMolecules, searchTargets, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "chembl-mcp", version: "1.0.0" })

  server.tool(
    "search_molecules",
    "Find ChEMBL molecules by name or synonym.",
    {
      query: z.string().min(2).describe('Drug or compound name, e.g. "aspirin"'),
      limit: z.number().int().min(1).max(25).default(10).describe("Molecules to return")
    },
    async (a) => {
      try {
        return text(await searchMolecules(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "molecule_detail",
    "Full ChEMBL record for one molecule: formula, weight, approval phase.",
    {
      chemblId: z.string().regex(/^CHEMBL\d+$/).describe('ChEMBL id, e.g. "CHEMBL25"')
    },
    async (a) => {
      try {
        return text(await moleculeDetail(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_targets",
    "Find ChEMBL drug targets by name or gene.",
    {
      query: z.string().min(2).describe('Target name, e.g. "thrombin"'),
      limit: z.number().int().min(1).max(25).default(10).describe("Targets to return")
    },
    async (a) => {
      try {
        return text(await searchTargets(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
