import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatResult, runQuery, serverVersion, SurrealDbError, surrealqlReview, crateVersionMatrix, releaseFeed } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "surrealdb-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "server_version",
    {
      title: "Server version",
      description: "SurrealDB server version. No auth needed. Set SURREALDB_URL for non-default hosts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(`SurrealDB ${await serverVersion()}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "run_query",
    {
      title: "Run read query",
      description: "Run a read-only SurrealQL query (SELECT/RETURN/SHOW/DESCRIBE/INFO/COUNT/LET). Needs credentials.",
      inputSchema: z.object({
        sql: z.string().describe("SurrealQL read query, e.g. 'SELECT * FROM person LIMIT 5'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ sql }) => {
      try {
        return text(formatResult(await runQuery(sql)))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "surrealql_review",
    {
      title: "SurrealQL review",
      description: "Read a SurrealQL statement without executing it: which statements are reads, writes or schema changes, which tables each touches, and the footguns a SELECT without LIMIT, a SELECT *, a GROUP BY ALL, a DELETE with no WHERE, a RELATE with no CONTENT, a password in a DEFINE USER or a USE that leaks into later statements would cause.",
      inputSchema: z.object({ query: z.string().describe("The SurrealQL to review, up to 20000 characters.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await surrealqlReview(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "crate_version_matrix",
    {
      title: "Crate version matrix",
      description: "The published SurrealDB crate from crates.io: latest and newest stable version, version count, all-time and 90-day downloads, licence, keywords and categories, the cargo feature flags on the latest version, its dependency count and minimum Rust version, recent versions with their downloads, the most downloaded version of any, and how many versions have been yanked.",
      inputSchema: z.object({
        crate: z.string().describe("Crate name, default 'surrealdb'.").optional(),
        limit: z.number().describe("How many recent versions to list, 3-10.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await crateVersionMatrix(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "release_feed",
    {
      title: "Release feed",
      description: "The upstream SurrealDB release train from GitHub: each release with its date, prerelease flag and notes, the mean gap between releases, and the repository's stars, forks, open issues, licence and last push, so the published crate and the server version can be compared.",
      inputSchema: z.object({ limit: z.number().describe("How many releases to show, 1-10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await releaseFeed(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof SurrealDbError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
