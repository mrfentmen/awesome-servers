import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listMembers,
  listCollections,
  listGroups,
  getEvents,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "bitwarden-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_members",
    {
      title: "List org members",
      description: "Organization members: names, emails, status, collections access.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listMembers());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_collections",
    {
      title: "List collections",
      description: "Organization collections with member and group assignments.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listCollections());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_groups",
    {
      title: "List groups",
      description: "Organization groups with member ids and collection access.",
      inputSchema: z.object({
      }),
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

  server.registerTool(
    "get_events",
    {
      title: "Get event logs",
      description: "Organization event log: logins, item actions, admin changes. Optional date range.",
      inputSchema: z.object({
        start: z.string().optional().describe("Start date YYYY-MM-DD"),
        end: z.string().optional().describe("End date YYYY-MM-DD"),
      }),
      annotations: READ_ONLY,
    },
    async ({ start, end }) => {
      try {
        return text(await getEvents(start, end));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
