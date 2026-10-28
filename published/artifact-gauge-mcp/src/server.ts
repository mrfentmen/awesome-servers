import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspect, manifest } from "./gauge.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "artifact-gauge-mcp", version: "1.0.0" })
  server.tool("inspect_artifacts", "Inspect local artifact sizes, extension totals, largest files, and dependency manifest names without returning file contents.", { project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }, async ({ project }) => { try { return text(format(await inspect(project))) } catch (error) { return errorText(error) } })
  server.tool("inspect_manifest", "Inspect bounded metadata for one recognized local dependency manifest without returning its contents or versions.", { project: z.string().min(1).max(1000), file: z.string().min(1).max(500) }, async ({ project, file }) => { try { return text(format(await manifest(project, file))) } catch (error) { return errorText(error) } })
  return server
}
