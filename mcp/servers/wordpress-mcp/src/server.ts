import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { m0_pluginInfo, m0_searchPlugins, m1_search, themeInfo, themeList } from './api.js'
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'wordpress-mcp', version: '1.0.0' })
server.registerTool(
    "plugin_info",
    {
      title: "Plugin info",
      description: "Get details for a WordPress plugin.",
      inputSchema: z.object( { slug: z.string().describe("Plugin slug.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_pluginInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "search_plugins",
    {
      title: "Search plugins",
      description: "Search plugins.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_searchPlugins(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search WordPress themes.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "theme_info",
    {
      title: "Theme info",
      description: "One wordpress.org theme's record: version, author, rating, active installs and tags, which the plugin tools cannot fetch.",
      inputSchema: z.object( { slug: z.string().describe("Theme slug, e.g. twentytwentyfour."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: theme_info ----
    const paywallMessage = await premiumRequired("theme_info")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await themeInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "theme_list",
    {
      title: "Theme list",
      description: "Browse the wordpress.org theme directory by search term, with each theme's rating and active install count, which no existing tool does.",
      inputSchema: z.object( { query: z.string().describe("Search term, e.g. blog.").optional(), limit: z.number().describe("Max themes.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: theme_list ----
    const paywallMessage = await premiumRequired("theme_list")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await themeList(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
