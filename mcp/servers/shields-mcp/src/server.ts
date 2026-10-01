import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { badge } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "shields-mcp", version: "1.0.0" })
  server.registerTool(
    "badge",
    {
      title: "Badge",
      description: "Build a badge URL.",
      inputSchema: z.object( { label: z.string().describe("Label text."), message: z.string().describe("Message text."), color: z.string().describe("Color like green.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await badge(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "package_version",
    {
      title: "Package version",
      description: "The latest published version of a package, read live from Shields.io for npm, PyPI, crates.io, NuGet, Packagist or RubyGems.",
      inputSchema: z.object( { ecosystem: z.enum(["npm", "pypi", "crates", "nuget", "packagist", "gem"]).describe("Registry the package lives in"), packageName: z.string().min(1).max(120).describe("Package name") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: package_version ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_shields_package_version", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "repo_badge",
    {
      title: "Repo badge",
      description: "A live GitHub repository metric from Shields.io: stars, forks, open and closed issues, contributors, last commit, release date, repo size or commit activity.",
      inputSchema: z.object( { owner: z.string().min(1).max(60).describe("Repository owner"), repo: z.string().min(1).max(80).describe("Repository name"), metric: z.enum(["stars", "forks", "issues", "issues-closed", "contributors", "last-commit", "release-date", "repo-size", "commit-activity-y", "commit-activity-m"]).describe("Which metric to read") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: repo_badge ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_shields_repo_badge", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
