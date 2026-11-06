import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { ThesesError, record, search } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof ThesesError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "theses-fr-mcp", version: "1.0.0" })

  server.tool(
    "search",
    "Search French doctoral theses on theses.fr by title, subject, author or supervisor.",
    {
      q: z.string().min(1).describe('Words to look for, e.g. "intelligence artificielle" or an author name'),
      limit: z.number().int().min(1).max(100).default(10).describe("Theses per page, 1-100"),
      page: z.number().int().min(1).default(1).describe("Page number, starting at 1"),
    },
    async ({ q, limit, page }) => {
      try {
        return text(await search(q, limit, page))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "record",
    "One thesis by NNT or theses.fr id: title, author, supervisors, jury, university, discipline, subjects and DOI.",
    {
      id: z.string().min(4).describe('NNT or id, e.g. "2016REN1S112" or "s431762", or a full theses.fr URL'),
    },
    async ({ id }) => {
      try {
        return text(await record(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
