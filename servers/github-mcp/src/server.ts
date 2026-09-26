import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  me,
  listRepos,
  getRepo,
  searchRepos,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "github-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "me",
    {
      title: "My profile",
      description: "Profile of the GitHub user the token belongs to.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await me());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_repos",
    {
      title: "List repos",
      description: "Repositories the token owner updated most recently.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listRepos(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_repo",
    {
      title: "Get repo",
      description: "Repository details for owner/repo, e.g. facebook/react.",
      inputSchema: z.object({
        owner: z.string().describe("Owner login."),
        repo: z.string().describe("Repo name only, e.g. react")
      }),
      annotations: READ_ONLY,
    },
    async ({ owner, repo }) => {
      try {
        return text(await getRepo(owner, repo));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_repos",
    {
      title: "Search repos",
      description: "Public repositories matching a query, e.g. mcp server.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchRepos(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}