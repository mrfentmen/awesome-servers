import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, getMetrics, getLive, getPages, getReferrer, referrerTaxonomy } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer(): McpServer {
  const server = new McpServer({
    name: "openpanel-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_metrics",
    {
      title: "Get metrics",
      description: "OpenPanel visitors, sessions, bounce rate and engagement for a project.",
      inputSchema: z.object({
        projectId: z.string().describe("OpenPanel project ID, e.g. 12345"),
        startDate: z.string().optional().describe("Start YYYY-MM-DD"),
        endDate: z.string().optional().describe("End YYYY-MM-DD"),
      }),
      annotations: READ_ONLY,
    },
    async ({ projectId, startDate, endDate }) => {
      try {
        return text(await getMetrics(projectId, startDate, endDate));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_live",
    {
      title: "Get live visitors",
      description: "Current active OpenPanel visitor count for a project.",
      inputSchema: z.object({
        projectId: z.string().describe("OpenPanel project ID, e.g. 12345"),
      }),
      annotations: READ_ONLY,
    },
    async ({ projectId }) => {
      try {
        return text(await getLive(projectId));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_pages",
    {
      title: "Get top pages",
      description: "Top OpenPanel pages by sessions for a project.",
      inputSchema: z.object({
        projectId: z.string().describe("OpenPanel project ID, e.g. 12345"),
      }),
      annotations: READ_ONLY,
    },
    async ({ projectId }) => {
      try {
        return text(await getPages(projectId));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_referrer",
    {
      title: "Get referrers",
      description: "OpenPanel traffic sources for a project.",
      inputSchema: z.object({
        projectId: z.string().describe("OpenPanel project ID, e.g. 12345"),
      }),
      annotations: READ_ONLY,
    },
    async ({ projectId }) => {
      try {
        return text(await getReferrer(projectId));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "tracker_sdk_matrix",
    {
      title: "Tracker SDK matrix",
      description: "Which Openpanel SDK to install and how much of each is really in use: the web, Next.js and React Native packages plus the server and CLI, each with its latest version, version count, last week's npm downloads, share of the five, and the dependency and peer footprint that decides whether an upgrade breaks you.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (_args) => {
    // TODO: implement matrix locally (paywall removed)
    try { return textError("Not yet implemented: matrix") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "project_health",
    {
      title: "Project health",
      description: "The Openpanel project from GitHub: licence, stars, forks, open issues, project age, days since the last push, contributors ranked by commits, the most recent tags, and the latest commit messages on the default branch.",
      inputSchema: z.object({ limit: z.number().describe("How many contributors, tags and commits to show, 1-10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement health locally (paywall removed)
    try { return textError("Not yet implemented: health") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "referrer_taxonomy",
    {
      title: "Referrer taxonomy",
      description: "Classify a pasted list of referrers into organic search, social, email client, newsletter, paid advertising, direct and unrecognised referral, with counts, percentages and example hosts, so a traffic report can be read before it is believed.",
      inputSchema: z.object({
        referrers: z.string().describe("One referrer URL or hostname per line, as your analytics export gives them."),
        limit: z.number().describe("How many example hosts to show per bucket, 1-10.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await referrerTaxonomy(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
