import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listOrgs,
  orgProjects,
  orgIssues,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "sentry-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_orgs",
    {
      title: "List orgs",
      description: "Organizations.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listOrgs());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "org_projects",
    {
      title: "Org projects",
      description: "Projects in an org.",
      inputSchema: z.object({
        org: z.string().describe("Org slug from the Sentry URL, e.g. my-org")
      }),
      annotations: READ_ONLY,
    },
    async ({ org }) => {
      try {
        return text(await orgProjects(org));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "org_issues",
    {
      title: "Org issues",
      description: "Recent issues (24h).",
      inputSchema: z.object({
        org: z.string().describe("Org slug from the Sentry URL, e.g. my-org")
      }),
      annotations: READ_ONLY,
    },
    async ({ org }) => {
      try {
        return text(await orgIssues(org));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}