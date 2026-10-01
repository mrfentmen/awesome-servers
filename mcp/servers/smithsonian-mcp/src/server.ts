import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatObject, searchObjects, SmithsonianError, openAccessCorpus, openAccessDigest } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "smithsonian-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_objects",
    {
      title: "Search collections",
      description: "Smithsonian artifacts, art, and specimens by keyword.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'Apollo 11', 'dinosaur'"),
        limit: z.number().int().min(1).max(100).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const rows = await searchObjects(query, limit)
        if (rows.length === 0) return text(`Nothing found for "${query}".`)
        return text(rows.map((o, i) => formatObject(o, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "openaccess_corpus",
    {
      title: "Open Access corpus",
      description: "Inventory of the Smithsonian Open Access metadata archive on its public S3 bucket - the keyless route to the same records. Lists the unit folders, or the shard count, byte size and update dates for one unit.",
      inputSchema: z.object( { unit: z.string().describe("Unit code, e.g. 'saam', 'nasm'. Omit to list every unit.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: openaccess_corpus ----
      const paywallMessage = await premiumRequired("openaccess_corpus")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await openAccessCorpus(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "openaccess_digest",
    {
      title: "Open Access digest",
      description: "Summarise a bounded sample of the Smithsonian Open Access metadata for one unit: object types, topics, access rights, date span and example records, read straight from the keyless S3 archive.",
      inputSchema: z.object({
        unit: z.string().describe("Unit code, e.g. 'saam'."),
        maxShards: z.number().int().min(1).max(25).default(3),
        maxBytes: z.number().int().min(100000).max(40000000).default(8000000),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await openAccessDigest(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof SmithsonianError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
