import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { formatHit, formatTarget, getTarget, OpenTargetsError, searchEntities, target_evidence } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "opentargets-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search",
    {
      title: "Search genes, diseases, drugs",
      description: "Search Open Targets for genes (targets), diseases, and drugs.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'BRCA1', 'Alzheimer', 'aspirin'"),
        entity: z.enum(["target", "disease", "drug"]).default("target"),
        limit: z.number().int().min(1).max(25).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, entity, limit }) => {
      try {
        const results = await searchEntities(query, entity, limit)
        if (results.length === 0) return text(`No Open Targets ${entity}s match "${query}".`)
        return text(`Open Targets ${entity}s for "${query}":\n\n${results.map((h, i) => formatHit(h, i)).join("\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_target",
    {
      title: "Get gene details",
      description: "Get a gene target: functions, known drugs, top associated diseases with scores.",
      inputSchema: z.object({
        ensemblId: z.string().describe("Ensembl id, e.g. 'ENSG00000012048' for BRCA1 (use search to find it)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ ensemblId }) => {
      try {
        const t = await getTarget(ensemblId)
        if (!t) return text(`No Open Targets gene ${ensemblId}.`)
        return text(formatTarget(t))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "target_druggability",
    {
      title: "Target druggability",
      description: "Judge whether a gene is a sensible drug target from the fields that bear on it: whether loss of function is essential and what that means for the therapeutic window, which tractability buckets are true and across which modalities, and the genetic constraint measurements with the observed over expected ratio and a plain reading of how badly the gene tolerates being lost. The existing get_target lists drugs that already act on a gene, which says nothing about whether a new one could.",
      inputSchema: z.object({
        ensemblId: z.string().describe("Ensembl gene id, e.g. 'ENSG00000012048' for BRCA1. Use search first."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement druggability locally (paywall removed)
      try { return textError("Not yet implemented: druggability") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "target_pathways",
    {
      title: "Target pathways",
      description: "Report every Reactome pathway a gene sits in, grouped by top level pathway with Reactome links, and every cancer hallmark it is linked to with the role given, promoting or suppressing, and the PubMed id behind it. Says when a target is in no pathway at all or annotated with no hallmark. The existing get_target returns function descriptions and associated diseases and touches neither pathways nor hallmarks.",
      inputSchema: z.object({
        ensemblId: z.string().describe("Ensembl gene id, e.g. 'ENSG00000012048'."),
        limit: z.number().int().min(1).max(60).optional().describe("How many pathways to list. Default 20."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement pathways locally (paywall removed)
      try { return textError("Not yet implemented: pathways") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "target_evidence",
    {
      title: "Target evidence volume",
      description: "Report how much evidence a target has by volume: the linked publication count and earliest year, and every cross-reference Open Targets holds broken down by source with example identifiers, separating structural records such as PDB and ChEMBL from indexing references, and flagging when one source holds most of them. The existing tools report neither, so a target with three links and one with three hundred look identical.",
      inputSchema: z.object({
        ensemblId: z.string().describe("Ensembl gene id, e.g. 'ENSG00000012048'."),
        limit: z.number().int().min(5).max(60).optional().describe("Reserved for list length. Default 30."),
      }),
      annotations: READ_ONLY,
    },
    async ({ ensemblId, limit }) => {
      try { return text(await target_evidence({ ensemblId, limit })) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "drug_profile",
    {
      title: "Drug profile",
      description: "A ChEMBL drug from Open Targets: its type, maximum clinical stage, trade names and the targets its mechanism of action points at. search can find a drug, but no existing tool reports what that drug is or what it acts on.",
      inputSchema: z.object( { chemblId: z.string().describe("ChEMBL drug id, e.g. 'CHEMBL25' for aspirin."), limit: z.number().int().describe("Max mechanism rows and targets to list.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement profile locally (paywall removed)
    try { return textError("Not yet implemented: profile") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof OpenTargetsError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
