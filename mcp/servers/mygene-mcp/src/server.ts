import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { get, query } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "mygene-mcp", version: "1.0.0" })
  server.registerTool(
    "query",
    {
      title: "Query",
      description: "Query genes.",
      inputSchema: z.object( { q: z.string().describe("Gene name, symbol, or keyword."), size: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await query(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get",
    {
      title: "Get",
      description: "Get a gene by id.",
      inputSchema: z.object( { id: z.string().describe("Gene id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await get(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "gene_pathways",
    {
      title: "Gene pathways",
      description: "The pathway annotations MyGene holds for a gene: which Biocarta, KEGG, Reactome, WikiPathways and other pathway collections it belongs to.",
      inputSchema: z.object( { symbol: z.string().describe("Gene symbol, e.g. TP53."), species: z.string().describe("Species name, e.g. human.").optional(), limit: z.number().int().min(1).max(30).default(10).describe("Max entries per source.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: gene_pathways ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_mygene_gene_pathways", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "gene_location",
    {
      title: "Gene location",
      description: "Where a gene sits on the genome: cytoband, chromosome, start and end coordinates, strand, plus its Ensembl and Entrez ids.",
      inputSchema: z.object( { id: z.string().describe("MyGene id such as 7157, or a symbol such as TP53.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: gene_location ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_mygene_gene_location", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
