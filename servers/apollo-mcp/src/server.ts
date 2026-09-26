import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  health,
  matchPerson,
  searchPeople,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "apollo-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "health",
    {
      title: "Account health",
      description: "Key status.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await health());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "match_person",
    {
      title: "Enrich person",
      description: "Match by email/name/company.",
      inputSchema: z.object({
        email: z.string().describe("Work email, e.g. jane@acme.com").optional(),
        first_name: z.string().describe("First name, e.g. Jane").optional(),
        last_name: z.string().describe("Last name, e.g. Doe").optional(),
        organization: z.string().describe("Employer, e.g. Acme Corp").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ email, first_name, last_name, organization }) => {
      try {
        return text(await matchPerson(email, first_name, last_name, organization));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_people",
    {
      title: "Search people",
      description: "Prospect search.",
      inputSchema: z.object({
        query: z.string().describe("Search keywords, e.g. software engineer"),
        limit: z.string().describe("Max results (default 5, max 25).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchPeople(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}