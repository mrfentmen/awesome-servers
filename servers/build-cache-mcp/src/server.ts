import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectBuildCache, artifactBreakdown, reclaimableCache } from "./core.js"
import { premiumRequired } from "./license.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
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
      // ---- paywall: artifact_breakdown ----
      const paywallMessage = await premiumRequired("artifact_breakdown")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
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
      // ---- paywall: reclaimable_cache ----
      const paywallMessage = await premiumRequired("reclaimable_cache")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await reclaimableCache(input)) } catch (error) { return errorText(error) }
    }
  )
  return server
}
