import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatObject, listBuckets, listObjects, WasabiError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "wasabi-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_buckets",
    {
      title: "List buckets",
      description: "Wasabi buckets via S3. Set WASABI_ACCESS_KEY + WASABI_SECRET_KEY (+ WASABI_REGION).",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listBuckets()
        if (rows.length === 0) return text("No buckets.")
        return text(rows.map((b, i) => `${i + 1}. ${b}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_objects",
    {
      title: "List objects",
      description: "Objects in one bucket with sizes and dates.",
      inputSchema: z.object({
        bucket: z.string().describe("Bucket name"),
        prefix: z.string().default("").describe("Key prefix filter"),
        limit: z.number().int().min(1).max(100).default(20),
      }),
      annotations: READ_ONLY,
    },
    async ({ bucket, prefix, limit }) => {
      try {
        const rows = await listObjects(bucket, prefix, limit)
        if (rows.length === 0) return text(`No objects in ${bucket}.`)
        return text(rows.map((o, i) => formatObject(o, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof WasabiError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
