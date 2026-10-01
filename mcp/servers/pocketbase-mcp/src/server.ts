import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { createRecord, formatRecord, health, listCollections, listRecords, PocketBaseError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "pocketbase-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "health",
    {
      title: "Check health",
      description: "Check that the PocketBase instance answers. Set POCKETBASE_URL for non-default hosts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await health())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_collections",
    {
      title: "List collections",
      description: "List PocketBase collections. Needs POCKETBASE_EMAIL + POCKETBASE_PASSWORD of a superuser.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listCollections()
        if (rows.length === 0) return text("No collections.")
        return text(rows.map((c, i) => `${i + 1}. [${c.id}] ${c.name}${c.type ? ` (${c.type})` : ""}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_records",
    {
      title: "List records",
      description: "List records of a collection, with optional PocketBase filter syntax.",
      inputSchema: z.object({
        collection: z.string().describe("Collection name or id, e.g. 'notes'"),
        filter: z.string().default("").describe("Filter expression, e.g. 'title ~ \"hi\"'"),
        limit: z.number().int().min(1).max(200).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ collection, filter, limit }) => {
      try {
        const rows = await listRecords(collection, filter, limit)
        if (rows.length === 0) return text(`No records in ${collection}.`)
        return text(rows.map((r, i) => formatRecord(r, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "create_record",
    {
      title: "Create record",
      description: "Create a record in a collection from a JSON object.",
      inputSchema: z.object({
        collection: z.string().describe("Collection name or id"),
        data: z.record(z.string(), z.unknown()).describe("Field values as a JSON object"),
      }),
      annotations: WRITE,
    },
    async ({ collection, data }) => {
      try {
        const r = await createRecord(collection, data as Record<string, unknown>)
        return text(`Created record ${(r as { id?: string }).id ?? ""} in ${collection}.`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof PocketBaseError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
