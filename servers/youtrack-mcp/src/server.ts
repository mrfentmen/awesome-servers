import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  groupIssues,
  issueDetail,
  issueStats,
  mergeRequests,
  projectIssues,
  recentIssues,
  searchProjects,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "youtrack-mcp",
    version: "2.0.0",
  })

  server.registerTool(
    "search_projects",
    {
      title: "Search projects",
      description: "Find public GitLab projects by name and list their stars, open issue count and description. No API key or account needed.",
      inputSchema: z.object({
        query: z.string().describe("Search term, for example cli tool."),
        limit: z.number().describe("How many projects to return, 1 to 30. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchProjects({ query, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "project_issues",
    {
      title: "List project issues",
      description: "List issues in a public project filtered by state, labels and free-text search, newest first, with assignees and comment counts.",
      inputSchema: z.object({
        project: z.string().describe("Project path such as gitlab-org/cli, or a numeric project id."),
        state: z.string().describe('One of "open", "closed" or "all". Defaults to open.').optional(),
        labels: z.string().describe("Comma-separated labels that must all be present, for example bug,P1.").optional(),
        search: z.string().describe("Words to find in the issue title or description.").optional(),
        limit: z.number().describe("How many issues to return, 1 to 50. Defaults to 15.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ project, state, labels, search, limit }) => {
      try {
        return text(await projectIssues({ project, state, labels, search, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "issue_detail",
    {
      title: "Issue details",
      description: "Fetch one issue by its project-internal number and return the full description, labels, assignees, dates and comment count.",
      inputSchema: z.object({
        project: z.string().describe("Project path such as gitlab-org/cli, or a numeric project id."),
        iid: z.number().describe("The issue number shown as #123 in the project."),
      }),
      annotations: READ_ONLY,
    },
    async ({ project, iid }) => {
      try {
        return text(await issueDetail({ project, iid }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "merge_requests",
    {
      title: "List merge requests",
      description: "List the merge requests in a project filtered by state, with the author, branches, last update and comment count, so you can see the work behind an issue.",
      inputSchema: z.object({
        project: z.string().describe("Project path such as gitlab-org/cli, or a numeric project id."),
        state: z.string().describe('One of "opened", "merged", "closed" or "all". Defaults to opened.').optional(),
        limit: z.number().describe("How many merge requests to return, 1 to 50. Defaults to 15.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ project, state, limit }) => {
      try {
        return text(await mergeRequests({ project, state, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "group_issues",
    {
      title: "Group issue board",
      description: "List the newest issues across every project in a GitLab group at once, with state, labels, assignees and the project each came from.",
      inputSchema: z.object({
        group: z.string().describe("Group path, for example gitlab-org."),
        state: z.string().describe('One of "open", "closed" or "all". Defaults to open.').optional(),
        labels: z.string().describe("Comma-separated labels that must all be present.").optional(),
        limit: z.number().describe("How many issues to return, 1 to 50. Defaults to 20.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ group, state, labels, limit }) => {
      try {
        return text(await groupIssues({ group, state, labels, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "issue_stats",
    {
      title: "Issue statistics",
      description: "Summarise a project's issue tracker: open versus closed, close rate, unassigned count, label breakdown, neglected issues and stale open issues.",
      inputSchema: z.object({
        project: z.string().describe("Project path such as gitlab-org/cli, or a numeric project id."),
        days: z.number().describe("Only count issues created in the last N days.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ project, days }) => {
      try {
        return text(await issueStats({ project, days }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "recent_issues",
    {
      title: "Recently updated issues",
      description: "Show the open issues that changed most recently in a project, so you can see what the team is actually working on.",
      inputSchema: z.object({
        project: z.string().describe("Project path such as gitlab-org/cli, or a numeric project id."),
        limit: z.number().describe("How many issues to show, 1 to 30. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ project, limit }) => {
      try {
        return text(await recentIssues({ project, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
