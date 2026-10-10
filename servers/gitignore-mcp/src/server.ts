import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { template } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "gitignore-mcp", version: "1.0.0" })
  server.registerTool(
    "template",
    {
      title: "Template",
      description: "Get a gitignore template.",
      inputSchema: z.object( { name: z.string().describe("Template name like node.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await template(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "list_templates",
    {
      title: "List templates",
      description: "Every gitignore template name Toptal publishes, so you can find the right one before fetching it.",
      inputSchema: z.object({  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: list_templates ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_gitignore_list_templates", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "merged_template",
    {
      title: "Merged template",
      description: "Get one gitignore file merged from several templates at once, for example node,python,django, with the sections it includes.",
      inputSchema: z.object({ templates: z.string().describe("Template names joined by commas, e.g. 'node,python'."), max_lines: z.number().describe("Max lines to show, 10-400, default 120.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: merged_template ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_gitignore_merged_template", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
