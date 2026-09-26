import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listPeople,
  getPerson,
  listGroups,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "folk-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_people",
    {
      title: "List people",
      description: "Contacts.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listPeople(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_person",
    {
      title: "Get person",
      description: "Contact details by ID.",
      inputSchema: z.object({
        person_id: z.string().describe("Folk person ID, e.g. p_1234")
      }),
      annotations: READ_ONLY,
    },
    async ({ person_id }) => {
      try {
        return text(await getPerson(person_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_groups",
    {
      title: "List groups",
      description: "Contact groups.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listGroups());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}