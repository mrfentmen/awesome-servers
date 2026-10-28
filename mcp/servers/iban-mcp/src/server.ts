import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { listIbanCountries, validateIban, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "iban-mcp", version: "1.0.0" })

  server.tool(
    "validate_iban",
    "Validate an IBAN: structure, country length table and mod-97 checksum, with a plain reason when it fails.",
    {
      iban: z.string().describe('IBAN, spaces and dashes are fine, e.g. GB82 WEST 1234 5698 7654 32')
    },
    async (a) => {
      try {
        return text(await validateIban(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "list_iban_countries",
    "List every IBAN country code with its required length, optionally filtered by code or name.",
    {
      search: z.string().optional().describe('Filter by code or country name, e.g. "germany"')
    },
    async (a) => {
      try {
        return text(await listIbanCountries(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}
