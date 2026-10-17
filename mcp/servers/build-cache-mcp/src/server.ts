import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectBuildCache, artifactBreakdown, reclaimableCache } from "./core.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() {
  const server = new McpServer({ name: "build-cache-mcp", version: "1.0.0" })
  server.registerTool(
    "inspect_build_cache",
    {
      title: "Inspect build cache",
      description: "Summarize local build and cache footprint using size and age buckets without returning paths or file contents.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).default(".") }),
      annotations: READ_ONLY,
    },
    async (input) => { try { return text(format(await inspectBuildCache(input))) } catch (error) { return errorText(error) } }
  )
  server.registerTool(
    "artifact_breakdown",
    {
      title: "Artifact breakdown",
      description: "Split a project's build and cache footprint by cache kind, with byte share, file counts and write dates.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).default(".") }),
      annotations: READ_ONLY,
    },
    async (input) => {
      try { return text(await artifactBreakdown(input)) } catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "reclaimable_cache",
    {
      title: "Reclaimable cache",
      description: "How much build cache is older than a week and could be dropped for a cold rebuild, by cache kind.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).default(".") }),
      annotations: READ_ONLY,
    },
    async (input) => {
      try { return text(await reclaimableCache(input)) } catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "npm_package_metadata",
    {
      title: "npm package metadata",
      description: "Read live npm package tarball size, file count, integrity, engine requirements and modified time.",
      inputSchema: z.object({ package: z.string().describe("npm package name; defaults to typescript.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement metadata locally (paywall removed)
    try { return textError("Not yet implemented: metadata") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "github_latest_release",
    {
      title: "GitHub latest release",
      description: "Read the latest GitHub release and bounded asset size and download counts.",
      inputSchema: z.object({ owner: z.string().describe("GitHub owner; defaults to cli.").optional(), repo: z.string().describe("GitHub repository; defaults to cli.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement release locally (paywall removed)
    try { return textError("Not yet implemented: release") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
