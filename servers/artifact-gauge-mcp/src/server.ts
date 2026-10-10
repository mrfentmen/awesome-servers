import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { artifactHints, directoryWeights, format, inspect, manifest, sizeBudget } from "./gauge.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "artifact-gauge-mcp", version: "1.0.0" })
  server.registerTool(
    "inspect_artifacts",
    {
      title: "Inspect artifacts",
      description: "Inspect local artifact sizes, extension totals, largest files, and dependency manifest names without returning file contents.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
      annotations: READ_ONLY,
    },
    async ({ project }) => { try { return text(format(await inspect(project))) } catch (error) { return errorText(error) } }
  )
  server.registerTool(
    "inspect_manifest",
    {
      title: "Inspect manifest",
      description: "Inspect bounded metadata for one recognized local dependency manifest without returning its contents or versions.",
      inputSchema: z.object( { project: z.string().min(1).max(1000), file: z.string().min(1).max(500) }),
      annotations: READ_ONLY,
    },
    async ({ project, file }) => { try { return text(format(await manifest(project, file))) } catch (error) { return errorText(error) } }
  )
  server.registerTool(
    "inspect_directory_weights",
    {
      title: "Inspect directory weights",
      description: "Byte totals and share of the total for each top level directory, largest first, without returning file contents.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
      annotations: READ_ONLY,
    },
    async ({ project }) => {
      // ---- paywall: inspect_directory_weights ----
      const paywallMessage = await premiumRequired("inspect_directory_weights")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(format(await directoryWeights(project))) }
      catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "inspect_size_budget",
    {
      title: "Inspect size budget",
      description: "Compare local artifact bytes against a budget and break the spend down by extension.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).describe("Local project directory; no URLs"), budgetBytes: z.number().describe("Total byte budget to compare against.") }),
      annotations: READ_ONLY,
    },
    async ({ project, budgetBytes }) => {
      // ---- paywall: inspect_size_budget ----
      const paywallMessage = await premiumRequired("inspect_size_budget")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(format(await sizeBudget(project, budgetBytes))) }
      catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "inspect_artifact_hints",
    {
      title: "Inspect artifact hints",
      description: "Tally files whose extensions are commonly left behind by builds, logs and archives, without returning file contents.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
      annotations: READ_ONLY,
    },
    async ({ project }) => {
      try { return text(format(await artifactHints(project))) }
      catch (error) { return errorText(error) }
    }
  )
  return server
}
