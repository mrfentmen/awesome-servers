import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { npmPackage, npmSearch, pypiPackage } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "package-registry-mcp", version: "1.0.0" })
  server.registerTool(
    "npm_package",
    {
      title: "Npm package",
      description: "Look up an npm package by name.",
      inputSchema: z.object( { name: z.string().describe("Package name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await npmPackage(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "pypi_package",
    {
      title: "Pypi package",
      description: "Look up a PyPI package by name.",
      inputSchema: z.object( { name: z.string().describe("Package name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pypiPackage(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "npm_search",
    {
      title: "Npm search",
      description: "Search npm packages by keyword.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await npmSearch(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "npm_dist_tags",
    {
      title: "npm dist-tags",
      description: "The dist-tags of an npm package, which is how you find the LTS or next line rather than whatever latest happens to be.",
      inputSchema: z.object( { package: z.string().describe("npm package, e.g. express."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: npm_dist_tags ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_package_registry_npm_dist_tags", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "npm_publish_timeline",
    {
      title: "npm publish timeline",
      description: "An npm package's release history newest first with creation and last-modified dates, which shows how stale or how busy a package really is.",
      inputSchema: z.object( { package: z.string().describe("npm package, e.g. express."), limit: z.number().describe("Max versions.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: npm_publish_timeline ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_package_registry_npm_publish_timeline", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
