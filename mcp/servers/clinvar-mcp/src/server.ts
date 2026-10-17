import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, queryInfo } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "clinvar-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search ClinVar records.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "variant_summary",
    {
      title: "Variant summary",
      description: "Full ClinVar record for one variant: accession and version, object type, germline and somatic classifications with review status, genes, protein change, molecular consequence and supporting SCV and RCV submissions.",
      inputSchema: z.object( { id: z.string().describe("ClinVar id, e.g. VCV000000010 or 10.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement summary locally (paywall removed)
    try { return textError("Not yet implemented: summary") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "variant_counts",
    {
      title: "Variant counts",
      description: "Compare how many ClinVar records match several search terms such as competing genes or conditions, with the proportional bar and the exact query translation NCBI used for each.",
      inputSchema: z.object( { queries: z.string().describe("Terms separated by newlines or semicolons, e.g. BRCA1; BRCA2.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement counts locally (paywall removed)
    try { return textError("Not yet implemented: counts") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "query_info",
    {
      title: "Query info",
      description: "Explain a ClinVar search: total match count, the query translation NCBI built, the translation stack and sets, any warnings, and the first matching ids to feed into variant_summary.",
      inputSchema: z.object( { query: z.string().describe("Search term."), limit: z.number().describe("Max ids to list.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await queryInfo(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  return server
}
