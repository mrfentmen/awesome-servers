import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { ConfluentError, formatCluster, listClusters, listEnvironments } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "confluent-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_environments",
    {
      title: "List environments",
      description: "Confluent Cloud environments with ids and names.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listEnvironments()
        if (rows.length === 0) return text("No environments.")
        return text(rows.map((e, i) => `${i + 1}. [${e.id}] ${e.name ?? "(unnamed)"}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_clusters",
    {
      title: "List Kafka clusters",
      description: "Kafka clusters in one environment: cloud, region, availability, endpoint.",
      inputSchema: z.object({
        environment: z.string().describe("Environment id, e.g. 'env-abc123' (use list_environments)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ environment }) => {
      try {
        const rows = await listClusters(environment)
        if (rows.length === 0) return text(`No clusters in ${environment}.`)
        return text(rows.map((c, i) => formatCluster(c, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof ConfluentError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
