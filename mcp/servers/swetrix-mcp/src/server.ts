import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, listProjects, getProject, campaignParameters } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer(): McpServer {
  const server = new McpServer({
    name: "swetrix-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description: "All Swetrix projects with ids and domains.",
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
    "get_project",
    {
      title: "Get project",
      description: "One Swetrix project with settings and stats summary.",
      inputSchema: z.object({
        projectId: z.string().describe("Swetrix project ID, e.g. 12345"),
      }),
      annotations: READ_ONLY,
    },
    async ({ projectId }) => {
      try {
        return text(await getProject(projectId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "campaign_parameters",
    {
      title: "Campaign parameters",
      description: "Audit the utm_ parameters on a list of URLs, computed locally: which campaigns, sources and mediums they name and how often, how many URLs are untagged or only partly tagged, whether term and content are missing, and the case or stray-parameter mistakes that split one channel across two rows in a report.",
      inputSchema: z.object({
        urls: z.string().describe("One URL per line, up to 30000 characters."),
        limit: z.number().describe("How many rows per breakdown to show, 1-20.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await campaignParameters(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "sdk_release_feed",
    {
      title: "SDK release feed",
      description: "The published swetrix tracker package on npm: latest version, how many versions exist, days since the last publish, the median, shortest and longest gap between releases, its dependency count, last week's download count, the most recent versions by date, and the project's newest GitHub release tags for comparison.",
      inputSchema: z.object({ limit: z.number().describe("How many versions and releases to show, 1-10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: sdk_release_feed ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_swetrix_sdk_release_feed", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "ecosystem_audit",
    {
      title: "Ecosystem audit",
      description: "The project's shape from GitHub: licence, age, days since the last push, stars, forks, watchers and open issues, the language mix as a share of bytes, contributors ranked by commits with the top contributor's share, and an explicit judgement on the bus factor and on whether a single language dominates the codebase.",
      inputSchema: z.object({ limit: z.number().describe("How many languages and contributors to show, 1-10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: ecosystem_audit ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_swetrix_ecosystem_audit", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
