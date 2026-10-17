import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { entry, search, publications } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "rcsb-pdb-mcp", version: "1.0.0" })
  server.registerTool(
    "entry",
    {
      title: "Entry",
      description: "Metadata for one PDB entry.",
      inputSchema: z.object( { id: z.string().describe("PDB ID like 4hhb.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await entry(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search the PDB by text.",
      inputSchema: z.object( { query: z.string().describe("Text like hemoglobin."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "polymer_entity",
    {
      title: "Polymer entity",
      description: "One polymer chain group of a PDB entry: description, type, chains and the one-letter sequence.",
      inputSchema: z.object( { id: z.string().describe("PDB ID like 4hhb."), entity: z.string().default("1").describe("Entity id like 1.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement entity locally (paywall removed)
    try { return textError("Not yet implemented: entity") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "ligands",
    {
      title: "Ligands",
      description: "The non-polymer entities of a PDB entry: component id, name, copy count, formula weight and the chains they sit in.",
      inputSchema: z.object( { id: z.string().describe("PDB ID like 4hhb.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement ligands locally (paywall removed)
    try { return textError("Not yet implemented: ligands") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "publications",
    {
      title: "Publications",
      description: "The primary and additional publications behind a PDB entry, with journal, year, authors, DOI and PubMed id.",
      inputSchema: z.object( { id: z.string().describe("PDB ID like 4hhb.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await publications(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
