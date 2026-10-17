import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { packageInfo, searchPackages, requirementScan } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "packagist-mcp", version: "1.0.0" })
  server.registerTool(
    "package_info",
    {
      title: "Package info",
      description: "Get details for a PHP package.",
      inputSchema: z.object( { name: z.string().describe("Package name like laravel/framework.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await packageInfo(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "search_packages",
    {
      title: "Search packages",
      description: "Search packages.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchPackages(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "release_history",
    {
      title: "Release history",
      description: "The release history behind a Packagist package: how many versions exist and how many are stable, when the first shipped, the median and longest gap between stable releases, the stable releases by major version, which versions are abandoned, the licences used across the history, and the most recent releases with their PHP requirement.",
      inputSchema: z.object( { name: z.string().describe("Package name like laravel/framework."), limit: z.number().describe("Recent releases to list, 5-40.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement history locally (paywall removed)
    try { return textError("Not yet implemented: history") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "package_metrics",
    {
      title: "Package metrics",
      description: "How much a Packagist package is actually used: total, monthly and daily downloads against the lifetime daily average, favers, GitHub stars, watchers, forks and open issues, dependents, suggesters, maintainer names, type, language and how long the package has existed.",
      inputSchema: z.object( { name: z.string().describe("Package name like monolog/monolog.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement metrics locally (paywall removed)
    try { return textError("Not yet implemented: metrics") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "requirement_scan",
    {
      title: "Requirement scan",
      description: "Audit a package's own requirements across its stable releases: how many releases declare a given dependency such as php or psr/log, which constraints were used and when each change landed, and how wide the requirement sets get across the history.",
      inputSchema: z.object( { name: z.string().describe("Package name like monolog/monolog."), requirement: z.string().describe("Requirement to scan for, e.g. php, psr/log, ext-json.").optional(), limit: z.number().describe("Constraint changes to show, 5-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await requirementScan(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
