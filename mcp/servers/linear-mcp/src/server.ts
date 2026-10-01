import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, me, listTeams, searchIssues, getIssue, teamIssues, listProjects, myIssues, listLabels, createIssue, updateIssueTitle } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "linear-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "me",
    {
      title: "Viewer",
      description: "The Linear user the API key belongs to.",
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
    "list_teams",
    {
      title: "List teams",
      description: "Teams in the workspace, with key and id.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listTeams());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_issues",
    {
      title: "Search issues",
      description: "Search issues by text, e.g. login bug.",
      inputSchema: z.object({
        term: z.string().describe("Search text."),
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ term, limit }) => {
      try {
        return text(await searchIssues(term, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_issue",
    {
      title: "Get issue",
      description: "Issue details.",
      inputSchema: z.object({
        issue_id: z.string().describe("Issue UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ issue_id }) => {
      try {
        return text(await getIssue(issue_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "team_issues",
    {
      title: "Team issues",
      description: "Issues in a team.",
      inputSchema: z.object({
        team_id: z.string().describe("Team UUID."),
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ team_id, limit }) => {
      try {
        return text(await teamIssues(team_id, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description: "Linear projects.",
      inputSchema: z.object({}),
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
    "my_issues",
    {
      title: "My issues",
      description: "Assigned to me.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await myIssues(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_labels",
    {
      title: "List labels",
      description: "Team labels.",
      inputSchema: z.object({
        team_id: z.string().describe("Team UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ team_id }) => {
      try {
        return text(await listLabels(team_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "create_issue",
    {
      title: "Create issue",
      description: "Create a REAL issue.",
      inputSchema: z.object({
        team_id: z.string().describe("Team UUID."),
        title: z.string().describe("Title."),
        description: z.string().describe("Description.").optional()
      }),
      annotations: MUTATING,
    },
    async ({ team_id, title, description }) => {
      try {
        return text(await createIssue(team_id, title, description));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "update_issue_title",
    {
      title: "Rename issue",
      description: "Rename a REAL issue.",
      inputSchema: z.object({
        issue_id: z.string().describe("Issue UUID."),
        title: z.string().describe("New title.")
      }),
      annotations: MUTATING,
    },
    async ({ issue_id, title }) => {
      try {
        return text(await updateIssueTitle(issue_id, title));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "package_adoption",
    {
      title: "Package adoption",
      description: "How much an npm package is actually used and how recently it shipped: monthly download count, dist-tags, release cadence, deprecation count and maintainers. No Linear key needed.",
      inputSchema: z.object({ package: z.string().describe("npm package name, e.g. lodash") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: package_adoption ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_linear_package_adoption", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "project_scorecard",
    {
      title: "Project scorecard",
      description: "The OpenSSF scorecard for a repository: the aggregate supply-chain score and the individual checks behind it, worst first, with the reason each one gives.",
      inputSchema: z.object({ repo: z.string().describe("github.com owner/repository, e.g. expressjs/express"), limit: z.number().int().min(1).max(25).default(8).describe("How many checks to print (default 8, max 25).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: project_scorecard ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_linear_project_scorecard", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}