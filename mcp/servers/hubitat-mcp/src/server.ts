import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { deviceStatus, formatDevice, HubitatError, listDevices, sendCommand, communitySearch } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "hubitat-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_devices",
    {
      title: "List devices",
      description: "Hubitat devices via Maker API: ids, labels, types.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listDevices()
        if (rows.length === 0) return text("No devices.")
        return text(rows.map((d, i) => formatDevice(d, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "device_status",
    {
      title: "Device status",
      description: "One device with current attribute values (switch, level, temperature...).",
      inputSchema: z.object({
        id: z.string().describe("Numeric device id (use list_devices)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(await deviceStatus(id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "send_command",
    {
      title: "Send command",
      description: "Send a command to a device, e.g. on/off with optional value.",
      inputSchema: z.object({
        id: z.string().describe("Numeric device id"),
        command: z.string().describe("Command, e.g. 'on', 'off', 'setLevel'"),
        value: z.string().default("").describe("Optional value, e.g. '75' for setLevel"),
      }),
      annotations: WRITE,
    },
    async ({ id, command, value }) => {
      try {
        return text(await sendCommand(id, command, value))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "community_search",
    {
      title: "Community search",
      description: "Search the Hubitat Community for a device, driver or capability: each match shows the matching post with its excerpt and author, then the thread with its category, tags, size, activity and a link. Optionally restricted to one category id.",
      inputSchema: z.object({ query: z.string().describe("What to look for, e.g. 'driver code', a device model, or a capability like 'pushButton'."), category: z.number().describe("Restrict to one category id, e.g. 72 for Custom Apps and Drivers.").optional(), results: z.number().describe("How many results to show, 1-20.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await communitySearch(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "thread_digest",
    {
      title: "Thread digest",
      description: "Read one Hubitat Community thread the way you would before installing somebody's driver: size, views, likes, tags, closed or accepted-answer flags, then every post with its author, date and text, page by page.",
      inputSchema: z.object({ topicId: z.number().describe("Topic id, from community_search or category_roadmap."), postNumber: z.number().describe("First post to show, for paging through a long thread.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: thread_digest ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_hubitat_thread_digest", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "category_roadmap",
    {
      title: "Category roadmap",
      description: "Map the Hubitat Community: every top-level category with its topic and post counts, subcategories and description, or pick one category by name, slug or id to see its latest threads with links.",
      inputSchema: z.object({ category: z.union([z.string(), z.number()]).describe("Category name, slug or id, e.g. 'Custom Apps and Drivers' or 72. Omit for the whole map.").optional(), topics: z.number().describe("How many latest topics to list, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: category_roadmap ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_hubitat_category_roadmap", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof HubitatError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
