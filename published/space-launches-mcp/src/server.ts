import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_nextLaunch, m0_upcomingLaunches, m1_list, m2_previous, m2_upcoming } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'space-launches-mcp', version: '1.0.0' })
server.registerTool(
    "upcoming_launches",
    {
      title: "Upcoming launches",
      description: "List upcoming rocket launches.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_upcomingLaunches(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "next_launch",
    {
      title: "Next launch",
      description: "Get the next scheduled launch.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_nextLaunch(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "list",
    {
      title: "List",
      description: "Astronaut profiles.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_list(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "upcoming",
    {
      title: "Upcoming",
      description: "Upcoming launches.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m2_upcoming(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "previous",
    {
      title: "Previous",
      description: "Previous launches.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m2_previous(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "launch_by_id",
    {
      title: "Launch by id",
      description: "One space launch in full from the SpaceDevs database: its window and go probability, rocket, provider, pad, mission and any hold or failure reason.",
      inputSchema: z.object( { id: z.string().describe("Launch UUID or slug, e.g. sr75-flight-2.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement id locally (paywall removed)
    try { return textError("Not yet implemented: id") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "launcher_configs",
    {
      title: "Launcher configs",
      description: "The rocket configurations the SpaceDevs database knows, with manufacturer, family, variant, reusability and how many launches each has flown.",
      inputSchema: z.object( { search: z.string().describe("Filter by name, manufacturer or family, e.g. falcon.").optional(), limit: z.number().describe("Max configurations.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement configs locally (paywall removed)
    try { return textError("Not yet implemented: configs") } catch (e) { return textError(String(e)) }
  }
  )
const serverName = "space-launches-mcp"

  server.registerTool(
    "health_check",
    {
      title: "Health check",
      description: "Check if the server is running and responsive.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("OK - server is running")
    }
  )
  server.registerTool(
    "version_info",
    {
      title: "Version info",
      description: "Get server version and metadata.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2))
    }
  )
  server.registerTool(
    "list_tools",
    {
      title: "List tools",
      description: "List all available tools on this server.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("See the tools/list response for the full tool list.")
    }
  )


  return server
}
