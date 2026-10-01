import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectDeprecationRadar, inspectVersionPins, inspectEndpointInventory } from "./core.js"
import { premiumRequired } from "./license.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() {
  const server = new McpServer({ name: "api-deprecation-radar-mcp", version: "1.0.0" })
  server.registerTool(
    "inspect_deprecation_radar",
    {
      title: "Inspect deprecation radar",
      description: "Count local API deprecation markers by broad severity without returning endpoint names, paths, values, or source.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).default(".") }),
      annotations: READ_ONLY,
    },
    async (input) => { try { return text(format(await inspectDeprecationRadar(input))) } catch (error) { return errorText(error) } }
  )
  server.registerTool(
    "inspect_version_pins",
    {
      title: "Inspect version pins",
      description: "Read every dependency manifest in a project and classify version specifiers as exact, caret, tilde, wildcard, unbounded or floating, with the share of specifications that can drift on a fresh install.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).default("."), pin: z.string().max(200).optional() }),
      annotations: READ_ONLY,
    },
    async (input) => {
    // ---- paywall: inspect_version_pins ----
    const paywallMessage = await premiumRequired("inspect_version_pins")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(format(await inspectVersionPins(input))) } catch (error) { return errorText(error) }
  }
  )
  server.registerTool(
    "inspect_endpoint_inventory",
    {
      title: "Inspect endpoint inventory",
      description: "Inventory the hard coded HTTP and HTTPS endpoints in a project, collapsing resource ids, counting versioned paths, and flagging every plain http call as insecure.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).default("."), scheme: z.string().max(10).optional() }),
      annotations: READ_ONLY,
    },
    async (input) => {
    // ---- paywall: inspect_endpoint_inventory ----
    const paywallMessage = await premiumRequired("inspect_endpoint_inventory")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(format(await inspectEndpointInventory(input))) } catch (error) { return errorText(error) }
  }
  )
  return server
}
