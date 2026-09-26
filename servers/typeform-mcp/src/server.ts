import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listForms,
  getForm,
  listResponses,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "typeform-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_forms",
    {
      title: "List forms",
      description: "All Typeform forms, with id and title.",
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
      description: "One form's structure: fields, logic and settings.",
      inputSchema: z.object({
        form_id: z.string().describe("Form ID from the Typeform URL, e.g. abc123XY")
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
    "list_responses",
    {
      title: "Responses",
      description: "Recent responses to a form, newest first.",
      inputSchema: z.object({
        form_id: z.string().describe("Form ID from the Typeform URL, e.g. abc123XY")
      }),
      annotations: READ_ONLY,
    },
    async ({ form_id }) => {
      try {
        return text(await listResponses(form_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}