import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchIssues,
  getIssue,
  listProjects,
  getIssueComments,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "youtrack-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_issues",
    {
      title: "Search issues",
      description: "Search YouTrack issues with query language: 'project: WEB #Unresolved', 'for: me', sorted by updated.",
      inputSchema: z.object({
        query: z.string().describe("YouTrack query"),
        limit: z.number().default(10).describe("How many issues"),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchIssues(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_issue",
    {
      title: "Get issue detail",
      description: "One YouTrack issue with summary, description, state, assignee, timestamps.",
      inputSchema: z.object({
        issueId: z.string().describe("Issue id like 'WEB-123'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ issueId }) => {
      try {
        return text(await getIssue(issueId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description: "YouTrack projects with ids, names and short names.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listProjects());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_issue_comments",
    {
      title: "Get issue comments",
      description: "Comments on a YouTrack issue with authors and timestamps.",
      inputSchema: z.object({
        issueId: z.string().describe("Issue id"),
        limit: z.number().default(10).describe("How many comments"),
      }),
      annotations: READ_ONLY,
    },
    async ({ issueId, limit }) => {
      try {
        return text(await getIssueComments(issueId, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
