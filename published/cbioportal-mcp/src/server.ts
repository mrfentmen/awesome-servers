import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { findGenes, listCancerTypes, listStudies, studyDetails, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "cbioportal-mcp", version: "1.0.0" })

  server.tool(
    "list_cancer_types",
    "cBioPortal cancer types, optionally filtered by a name or id substring.",
    {
      query: z.string().optional().describe("Optional substring to match against the cancer type name or id, e.g. lung"),
      limit: z.number().int().min(1).max(100).default(25).describe("Rows to return")
    },
    async (a) => {
      try {
        return text(await listCancerTypes(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "find_genes",
    "Find genes by keyword (symbol or name) in the cBioPortal gene index.",
    {
      query: z.string().min(1).describe("Gene symbol or keyword, e.g. EGFR"),
      limit: z.number().int().min(1).max(50).default(10).describe("Rows to return")
    },
    async (a) => {
      try {
        return text(await findGenes(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "list_studies",
    "Public cBioPortal studies, optionally filtered by a name keyword: study id, name and cancer type.",
    {
      query: z.string().optional().describe("Optional keyword matched against the study name, e.g. lung"),
      limit: z.number().int().min(1).max(50).default(10).describe("Rows to return")
    },
    async (a) => {
      try {
        return text(await listStudies(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "study_details",
    "One cBioPortal study in full: name, description, cancer type, reference and counts where given.",
    {
      studyId: z.string().min(2).describe("Study id, e.g. brca_tcga")
    },
    async (a) => {
      try {
        return text(await studyDetails(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}
