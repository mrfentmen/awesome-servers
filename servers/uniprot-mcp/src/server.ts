import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { accession, idmapResult, idmapRun, idmapStatus, proteome, taxonomy } from "./api.js"
import { search } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "uniprot-mcp", version: "1.0.0" })
  server.registerTool(
    "accession",
    {
      title: "Accession",
      description: "Details for a UniProt accession.",
      inputSchema: z.object( { accession: z.string().describe("Accession like P12345.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await accession(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search UniProt by text.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "proteome",
    {
      title: "Proteome",
      description: "Proteome by id like UP000005640.",
      inputSchema: z.object( { id: z.string().describe("Proteome id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await proteome(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "idmap_run",
    {
      title: "ID map run",
      description: "Start an identifier mapping job.",
      inputSchema: z.object( { ids: z.string().describe("Comma-separated ids."), from: z.string().describe("Source DB.").optional(), to: z.string().describe("Target DB.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await idmapRun(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "idmap_status",
    {
      title: "ID map status",
      description: "Mapping job status.",
      inputSchema: z.object( { jobId: z.string().describe("Job id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await idmapStatus(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "idmap_result",
    {
      title: "ID map result",
      description: "Mapping job results.",
      inputSchema: z.object( { jobId: z.string().describe("Job id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await idmapResult(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "taxonomy",
    {
      title: "Taxonomy",
      description: "Search taxa by name.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await taxonomy(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
