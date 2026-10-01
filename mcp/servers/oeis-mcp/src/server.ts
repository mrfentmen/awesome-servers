import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { formatSequence, getSequence, OeisError, searchSequences } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "oeis-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_sequences",
    {
      title: "Search sequences",
      description: "Search the OEIS by terms or a name query. Terms like '1,1,2,3,5,8' find sequences containing them.",
      inputSchema: z.object(
    { query: z.string().describe("Comma separated terms, a keyword, or a phrase, e.g. '1,1,2,3' or 'prime gaps'"), limit: z.number().int().min(1).max(10).default(5) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const results = await searchSequences(query, limit)
        if (results.length === 0) return text(`No OEIS sequences match "${query}".`)
        return text(`OEIS results for "${query}":\n\n${results.map((s, i) => formatSequence(s, i)).join("\n\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_sequence",
    {
      title: "Get sequence",
      description: "Get one OEIS sequence by its A number.",
      inputSchema: z.object(
    { id: z.string().describe("A number, e.g. 'A000045'") }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        const s = await getSequence(id)
        if (!s) return text(`No OEIS sequence ${id}.`)
        return text(formatSequence(s))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "sequence_terms",
    {
      title: "Sequence terms",
      description: "The full term list of an OEIS sequence from its b-file: every term with its index, plus the file's own offset header.",
      inputSchema: z.object( { id: z.string().describe("OEIS id like A000045."), start: z.number().describe("Terms to skip.").optional(), count: z.number().describe("How many terms.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: sequence_terms ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_oeis_sequence_terms", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof OeisError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
