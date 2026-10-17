import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, projectBranches } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "gitlab-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search public GitLab projects.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "project_detail",
    {
      title: "Project detail",
      description: "Full public record of one GitLab project: description, stars, forks, open issues, visibility, default branch, language, licence, topics and dates.",
      inputSchema: z.object({ project: z.string().describe("Project as namespace/project, or its numeric id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "project_issues",
    {
      title: "Project issues",
      description: "Issues on one public GitLab project, newest first, with state, author, labels and link.",
      inputSchema: z.object({
        project: z.string().describe("Project as namespace/project, or its numeric id."),
        state: z.enum(["opened", "closed", "all"]).default("opened").describe("Which issues to list."),
        limit: z.number().int().min(1).max(50).default(10).describe("Max issues (default 10, max 50)."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement issues locally (paywall removed)
    try { return textError("Not yet implemented: issues") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "project_branches",
    {
      title: "Project branches",
      description: "Branches of one public GitLab project with the head commit, who committed it, when, and whether the branch is protected or default.",
      inputSchema: z.object({
        project: z.string().describe("Project as namespace/project, or its numeric id."),
        limit: z.number().int().min(1).max(100).default(10).describe("Max branches (default 10, max 100)."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await projectBranches(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
