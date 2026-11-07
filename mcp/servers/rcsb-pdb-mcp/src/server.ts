import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { getStructure } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "rcsb-pdb-mcp", version: "1.0.0" })

  server.tool(
    "get_structure",
    "Structure summary for a PDB id",
    { pdb_id: z.string().min(4).max(4).describe("Four character PDB id, e.g. 4HHB") },
    async ({ pdb_id }) => {
      try {
        return text(await getStructure(pdb_id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
