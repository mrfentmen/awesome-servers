import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { properties, search, conceptHistory } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "rxnav-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Find drug candidates matching a term.",
      inputSchema: z.object( { term: z.string().describe("Drug name like lipitor.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "properties",
    {
      title: "Properties",
      description: "Properties for an RxNorm identifier.",
      inputSchema: z.object( { rxcui: z.string().describe("RxNorm identifier.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await properties(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "drug_products",
    {
      title: "Drug products",
      description: "The marketed drug products RxNorm records for an ingredient or drug name: branded drugs, clinical drug forms and single-ingredient drugs, with RxCUIs.",
      inputSchema: z.object( { name: z.string().describe("Ingredient or drug name, e.g. atorvastatin."), limit: z.number().int().min(1).max(40).default(15).describe("Max products.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement products locally (paywall removed)
    try { return textError("Not yet implemented: products") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "related_concepts",
    {
      title: "Related concepts",
      description: "Concepts RxNorm links to a given RxCUI at one relationship type: narrower clinical drugs, precise ingredients, brand names, ingredient forms or generic products.",
      inputSchema: z.object( { rxcui: z.string().describe("Numeric RxCUI."), tty: z.string().max(4).default("SCDF").describe("Relationship type, e.g. IN, PIN, SCD, SBD or SCDF.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement concepts locally (paywall removed)
    try { return textError("Not yet implemented: concepts") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "concept_history",
    {
      title: "Concept history",
      description: "The RxNorm status history of one RxCUI: current status, release and active dates, concept type, and its definitional ingredient and strength.",
      inputSchema: z.object( { rxcui: z.string().describe("Numeric RxCUI.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await conceptHistory(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
