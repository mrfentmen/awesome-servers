import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatSurvey, FormbricksError, listSurveys, surveyResponses } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "formbricks-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_surveys",
    {
      title: "List surveys",
      description: "Formbricks surveys with statuses and response counts.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const rows = await listSurveys(limit)
        if (rows.length === 0) return text("No surveys.")
        return text(rows.map((s, i) => formatSurvey(s, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "survey_responses",
    {
      title: "Survey responses",
      description: "Latest responses of one survey.",
      inputSchema: z.object({
        id: z.string().describe("Survey id (use list_surveys)"),
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ id, limit }) => {
      try {
        const rows = await surveyResponses(id, limit)
        if (rows.length === 0) return text(`No responses for survey ${id}.`)
        return text(rows.join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof FormbricksError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
