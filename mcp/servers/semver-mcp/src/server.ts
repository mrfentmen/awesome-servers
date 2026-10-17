import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { compare, describe, sortVersions } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "semver-mcp", version: "1.0.0" })
  server.registerTool(
    "compare",
    {
      title: "Compare",
      description: "Compare two semantic versions.",
      inputSchema: z.object( { a: z.string().describe("Version A."), b: z.string().describe("Version B.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await compare(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "sort_versions",
    {
      title: "Sort versions",
      description: "Sort a comma separated list of versions.",
      inputSchema: z.object( { versions: z.string().describe("Comma separated versions.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await sortVersions(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "describe",
    {
      title: "Describe",
      description: "Describe a version: major, minor, patch, prerelease.",
      inputSchema: z.object( { version: z.string().describe("Version to describe.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await describe(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "latest_release",
    {
      title: "Latest release",
      description: "The version npm currently publishes as latest for a package, with its declared license, engines and tarball size.",
      inputSchema: z.object( { package: z.string().min(1).describe("npm package name, e.g. express.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement release locally (paywall removed)
    try { return textError("Not yet implemented: release") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "release_version",
    {
      title: "Release version",
      description: "What the npm registry holds for one exact version of a package, including whether the publisher has deprecated it.",
      inputSchema: z.object( { package: z.string().min(1).describe("npm package name, e.g. express."), version: z.string().min(1).describe("Exact version, e.g. 4.18.1.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement version locally (paywall removed)
    try { return textError("Not yet implemented: version") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
