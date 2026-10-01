import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, listInstalls, getInstall, listSites, platformStatus, currentIncidents, upcomingMaintenance } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "wpengine-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_installs",
    {
      title: "List installs",
      description: "All WP Engine installs with status, PHP version and domains.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listInstalls());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_install",
    {
      title: "Get install",
      description: "One WP Engine install with full details.",
      inputSchema: z.object({
        installId: z.string().describe("Install id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ installId }) => {
      try {
        return text(await getInstall(installId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_sites",
    {
      title: "List sites",
      description: "WP Engine sites with install links.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listSites());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "platform_status",
    {
      title: "Platform status",
      description: "Live WP Engine platform status from the public status page: every service group, which services are degraded, and the overall counters. No account needed.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(await platformStatus()) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "current_incidents",
    {
      title: "Current incidents",
      description: "Incidents on the WP Engine status page with start/resolve times and the latest update text, newest last.",
      inputSchema: z.object({
        include_resolved: z.boolean().default(false).describe("Also list incidents that have been resolved"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: current_incidents ----
    const paywallMessage = await premiumRequired("current_incidents")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await currentIncidents(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "upcoming_maintenance",
    {
      title: "Upcoming maintenance",
      description: "Maintenance windows WP Engine has scheduled, with the local page time and how long until each one starts.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async () => {
    // ---- paywall: upcoming_maintenance ----
    const paywallMessage = await premiumRequired("upcoming_maintenance")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await upcomingMaintenance()) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
