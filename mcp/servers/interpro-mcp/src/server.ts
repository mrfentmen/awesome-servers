import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { entry, search } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "interpro-mcp", version: "1.0.0" })
  server.registerTool(
    "entry",
    {
      title: "Entry",
      description: "Get an InterPro entry.",
      inputSchema: z.object( { id: z.string().describe("Entry accession like IPR000001.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await entry(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search entries.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "protein_entry_matches",
    {
      title: "Protein entry matches",
      description: "Which InterPro entries match one UniProt accession: entry name and type, integration date, member databases and matched protein records.",
      inputSchema: z.object( { accession: z.string().describe("UniProt accession, e.g. 'P04637'."), limit: z.number().int().min(1).max(50).default(15) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: protein_entry_matches ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_interpro_protein_entry_matches", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "entry_protein_matches",
    {
      title: "Entry protein matches",
      description: "Which UniProt proteins contain one InterPro entry: accession, name, source organism, length, AlphaFold presence and the matching entry type.",
      inputSchema: z.object( { accession: z.string().describe("InterPro accession, e.g. 'IPR000001'."), limit: z.number().int().min(1).max(30).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: entry_protein_matches ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_interpro_entry_protein_matches", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
