import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { listProjects, listRuns, myProfile, WandbError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "weightsbiases-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "my_profile",
    {
      title: "My profile",
      description: "Your W&B username and email.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const p = await myProfile()
        return text(`${p.username ?? "?"}${p.email ? ` <${p.email}>` : ""}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description: "ML projects of a user or team.",
      inputSchema: z.object({
        entity: z.string().describe("Username or team, e.g. your W&B handle"),
        limit: z.number().int().min(1).max(50).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ entity, limit }) => {
      try {
        const rows = await listProjects(entity, limit)
        if (rows.length === 0) return text(`No projects for ${entity}.`)
        return text(rows.map((p, i) => `${i + 1}. ${p.entity ?? entity}/${p.name}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_runs",
    {
      title: "List runs",
      description: "Recent training runs of a project with states.",
      inputSchema: z.object({
        entity: z.string().describe("Username or team"),
        project: z.string().describe("Project name"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ entity, project, limit }) => {
      try {
        const rows = await listRuns(entity, project, limit)
        if (rows.length === 0) return text(`No runs in ${entity}/${project}.`)
        return text(rows.map((r, i) => `${i + 1}. ${r.name ?? "?"} [${r.state ?? "?"}]${r.created ? ` (${r.created})` : ""}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof WandbError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
