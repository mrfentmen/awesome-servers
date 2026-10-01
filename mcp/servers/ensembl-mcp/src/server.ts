import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { lookup, sequence, genesInRegion } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ensembl-mcp", version: "1.0.0" })
  server.registerTool(
    "lookup",
    {
      title: "Lookup",
      description: "Look up a gene symbol.",
      inputSchema: z.object( { species: z.string().describe("Species, e.g. human.").optional(), symbol: z.string().describe("Gene symbol.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await lookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "sequence",
    {
      title: "Sequence",
      description: "Get sequence for a stable id.",
      inputSchema: z.object( { id: z.string().describe("Stable transcript id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await sequence(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "gene_transcripts",
    {
      title: "Gene transcripts",
      description: "Every Ensembl transcript of a gene, with biotype, length and which one is canonical.",
      inputSchema: z.object( { id: z.string().describe("Gene stable id, e.g. ENSG00000012048."), limit: z.number().describe("Max transcripts.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: gene_transcripts ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ensembl_gene_transcripts", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "gene_exons",
    {
      title: "Gene exon structure",
      description: "Exon coordinates and intronic versus exonic base counts for a gene or one transcript.",
      inputSchema: z.object( { id: z.string().describe("Gene or transcript stable id."), transcript: z.string().describe("Only exons of this transcript id.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: gene_exons ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ensembl_gene_exons", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "genes_in_region",
    {
      title: "Genes in region",
      description: "Ensembl features inside a genomic interval, by chromosome and coordinates.",
      inputSchema: z.object( { species: z.string().describe("Species, e.g. human.").optional(), chrom: z.string().describe("Chromosome, e.g. 7."), start: z.number().describe("Start coordinate."), end: z.number().describe("End coordinate."), feature: z.string().describe("Feature type, e.g. gene or transcript.").optional(), limit: z.number().describe("Max features.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await genesInRegion(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
