import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  search,
  family,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "epo-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search",
    {
      title: "Patent search",
      description: "Published applications by query.",
      inputSchema: z.object({
        query: z.string().describe("CQL query, e.g. ti=tesla."),
        range: z.string().describe("Result range (default 1-10).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, range }) => {
      try {
        return text(await search(query, range));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "family",
    {
      title: "Patent family",
      description: "Family for a publication number.",
      inputSchema: z.object({
        country: z.string().describe("Country code, e.g. EP"),
        number: z.string().describe("Publication number."),
        kind: z.string().describe("Kind code, e.g. A1.")
      }),
      annotations: READ_ONLY,
    },
    async ({ country, number, kind }) => {
      try {
        return text(await family(country, number, kind));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}