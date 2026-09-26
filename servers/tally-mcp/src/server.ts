import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listForms,
  getForm,
  listSubmissions,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "tally-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_forms",
    {
      title: "List forms",
      description: "All forms.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listForms());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_form",
    {
      title: "Get form",
      description: "Form structure.",
      inputSchema: z.object({
        form_id: z.string().describe("Form ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ form_id }) => {
      try {
        return text(await getForm(form_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_submissions",
    {
      title: "Submissions",
      description: "Form responses.",
      inputSchema: z.object({
        form_id: z.string().describe("Form ID."),
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ form_id, limit }) => {
      try {
        return text(await listSubmissions(form_id, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}