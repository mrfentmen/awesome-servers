import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { assaySummary, cidLookup, compound, formulaSearch, similar, substructure, synonyms } from "./api.js"
import { search } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "pubchem-mcp", version: "1.0.0" })
  server.registerTool(
    "compound",
    {
      title: "Compound",
      description: "Properties for a compound by name.",
      inputSchema: z.object( { name: z.string().describe("Compound name like aspirin.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await compound(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Find compound names matching a query.",
      inputSchema: z.object( { query: z.string().describe("Name fragment."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "cid_lookup",
    {
      title: "CID lookup",
      description: "Properties by numeric CID.",
      inputSchema: z.object( { cid: z.string().describe("Numeric CID like 2244.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await cidLookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "formula_search",
    {
      title: "Formula search",
      description: "Compounds by molecular formula.",
      inputSchema: z.object( { formula: z.string().describe("Formula like C9H8O4."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await formulaSearch(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "synonyms",
    {
      title: "Synonyms",
      description: "Names and identifiers for a CID.",
      inputSchema: z.object( { cid: z.string().describe("Numeric CID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await synonyms(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "similar",
    {
      title: "Similar",
      description: "Compounds by 2D similarity.",
      inputSchema: z.object( { smiles: z.string().describe("SMILES string."), threshold: z.number().describe("Tanimoto 60-100.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await similar(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "substructure",
    {
      title: "Substructure",
      description: "Compounds containing a pattern.",
      inputSchema: z.object( { smiles: z.string().describe("SMILES pattern."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await substructure(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "assay_summary",
    {
      title: "Assay summary",
      description: "Bioassay metadata by AID.",
      inputSchema: z.object( { aid: z.string().describe("Numeric assay AID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await assaySummary(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
