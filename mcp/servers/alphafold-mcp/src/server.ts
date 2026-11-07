import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { getPrediction } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "alphafold-mcp", version: "1.0.0" })

  server.tool(
    "get_prediction",
    "AlphaFold model for a UniProt accession",
    { accession: z.string().min(1).describe("UniProt accession, e.g. P00533") },
    async ({ accession }) => {
      try {
        return text(await getPrediction(accession))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
