import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { compareProjects, migrationOrdering } from "./api.js"
import { format, inspectMigrationMap } from "./core.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() {
  const server = new McpServer({ name: "migration-map-mcp", version: "1.0.0" })
  server.registerTool(
    "inspect_migration_map",
    {
      title: "Inspect migration map",
      description: "Find local migration numbering gaps and rollback pairing signals without returning SQL, paths, or migration names.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).default(".") }),
      annotations: READ_ONLY,
    },
    async (input) => { try { return text(format(await inspectMigrationMap(input))) } catch (error) { return errorText(error) } }
  )
  server.registerTool(
    "migration_ordering",
    {
      title: "Migration ordering",
      description: "Read a project's own migration numbers and report ordering advice: the next free number, gaps and whether they look like deletions, numbers reused across directories, and whether file-name order and numeric order disagree. Counts and sequence numbers only.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).default(".") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await migrationOrdering(args))
      } catch (error) {
        return errorText(error)
      }
    }
  )

  server.registerTool(
    "compare_projects",
    {
      title: "Compare projects",
      description: "Compare the migration numbering of two project paths: shared sequence numbers, which set tops out higher, whether the padding styles match and how many numbers are free in each. Counts and sequence numbers only.",
      inputSchema: z.object( {
        first: z.string().min(1).max(1000).describe("First project path, relative to the configured root."),
        second: z.string().min(1).max(1000).describe("Second project path, relative to the configured root."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await compareProjects(args))
      } catch (error) {
        return errorText(error)
      }
    }
  )

  return server
}
