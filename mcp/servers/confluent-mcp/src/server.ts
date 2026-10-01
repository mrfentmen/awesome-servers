import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { ConfluentError, formatCluster, listClusters, listEnvironments, listTopics, listConnectors, listSchemas } from "./api.js"
import { premiumRequired } from "./license.js"

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

  server.registerTool(
    "list_topics",
    {
      title: "List Kafka topics",
      description: "The topics on a Confluent Cloud Kafka cluster with the facts that decide whether each one is set up sanely: run state, partition count, replication factor, retention, cleanup policy and durability. Calls out any topic whose replication factor is below 3, which cannot survive a rack or zone outage.",
      inputSchema: z.object({
        cluster_id: z.string().describe("Cluster id, lkc-... See list_clusters."),
        limit: z.number().int().min(1).max(200).default(40).describe("Topics to list, default 40"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: list_topics ----
    const paywallMessage = await premiumRequired("list_topics")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await listTopics(args)) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) }
  }
  )

  server.registerTool(
    "list_connectors",
    {
      title: "List connectors",
      description: "The connectors deployed on a Confluent Cloud cluster with their run state, task states and any failure trace. A connector in a failed state has stopped moving data, so the failing task and its trace are surfaced first.",
      inputSchema: z.object({
        environment_id: z.string().describe("Environment id, env-... See list_environments."),
        cluster_id: z.string().describe("Cluster id, lkc-... See list_clusters."),
        expand: z.string().default("info,status,id").describe("Fields to expand, default info,status,id"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: list_connectors ----
    const paywallMessage = await premiumRequired("list_connectors")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await listConnectors(args)) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) }
  }
  )

  server.registerTool(
    "list_schemas",
    {
      title: "List Schema Registry subjects",
      description: "The subjects in Confluent Schema Registry with their schema type, global id, version count and latest version, which is how a subject that has quietly drifted or been superseded stands out. Can be narrowed by subject prefix and can return latest versions only.",
      inputSchema: z.object({
        subject_prefix: z.string().optional().describe("Only subjects starting with this prefix."),
        latest_only: z.string().optional().describe('Set to "true" to return only the latest version of each subject.'),
        limit: z.number().int().min(1).max(100).default(40).describe("Subjects to list, default 40"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await listSchemas(args)) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof ConfluentError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
