import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  me,
  listProjects,
  listInsights,
  insightDetails,
  dashboards,
  actions,
  events,
  persons,
  flags,
  cohorts,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "posthog-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "me",
    {
      title: "My profile",
      description: "The PostHog user the API key belongs to.",
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
    "list_projects",
    {
      title: "List projects",
      description: "Analytics projects in the organization.",
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
    "list_insights",
    {
      title: "List insights",
      description: "Saved insights in one project, with names.",
      inputSchema: z.object({
        project_id: z.string().describe("PostHog project ID, e.g. 12345")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await listInsights(project_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "insight_details",
    {
      title: "Insight details",
      description: "Single insight.",
      inputSchema: z.object({
        project_id: z.string().describe("Project ID."),
        insight_id: z.string().describe("Insight ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id, insight_id }) => {
      try {
        return text(await insightDetails(project_id, insight_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "dashboards",
    {
      title: "Dashboards",
      description: "Saved dashboards.",
      inputSchema: z.object({
        project_id: z.string().describe("Project ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await dashboards(project_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "actions",
    {
      title: "Actions",
      description: "Custom actions.",
      inputSchema: z.object({
        project_id: z.string().describe("Project ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await actions(project_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "events",
    {
      title: "Events",
      description: "Recent raw events.",
      inputSchema: z.object({
        project_id: z.string().describe("Project ID."),
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id, limit }) => {
      try {
        return text(await events(project_id, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "persons",
    {
      title: "Persons",
      description: "Identified users.",
      inputSchema: z.object({
        project_id: z.string().describe("Project ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await persons(project_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "flags",
    {
      title: "Feature flags",
      description: "All flags.",
      inputSchema: z.object({
        project_id: z.string().describe("Project ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await flags(project_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "cohorts",
    {
      title: "Cohorts",
      description: "User cohorts.",
      inputSchema: z.object({
        project_id: z.string().describe("Project ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await cohorts(project_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}