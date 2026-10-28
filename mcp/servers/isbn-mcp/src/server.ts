import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { checkIsbnBatch, convertIsbn, validateIsbn, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "isbn-mcp", version: "1.0.0" })

  server.tool(
    "validate_isbn",
    "Validate an ISBN-10 or ISBN-13 checksum and normalise it.",
    {
      isbn: z.string().describe('ISBN with or without hyphens, e.g. "978-0-306-40615-7"')
    },
    async (a) => {
      try {
        return text(await validateIsbn(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "convert_isbn",
    "Convert between ISBN-10 and ISBN-13 where the book has both.",
    {
      isbn: z.string().describe("ISBN-10 or ISBN-13")
    },
    async (a) => {
      try {
        return text(await convertIsbn(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "check_isbn_batch",
    "Validate a list of ISBNs at once and report the bad ones.",
    {
      isbns: z.array(z.string()).min(1).max(100).describe("ISBNs to check")
    },
    async (a) => {
      try {
        return text(await checkIsbnBatch(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
