import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { getTemplate, listTemplates, makeMeme, MemeError } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "memegen-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_templates",
    {
      title: "List meme templates",
      description: "All memegen.link templates: ids, names, line counts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listTemplates()
        const top = rows.slice(0, 40)
        return text(
          `Meme templates (${rows.length} total, showing ${top.length}):\n\n` +
          top.map((t) => `${t.id} — ${t.name} (${t.lines} lines)`).join("\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "make_meme",
    {
      title: "Make captioned meme",
      description: "Build a captioned meme image URL from a template id and text lines. No fetching needed.",
      inputSchema: z.object({
        template: z.string().describe("Template id, e.g. 'drake', 'fry', 'buzz' (use list_templates)"),
        lines: z.array(z.string()).min(1).max(8).describe("Caption lines, top to bottom"),
      }),
      annotations: READ_ONLY,
    },
    async ({ template, lines }) => {
      try {
        return text(makeMeme(template, lines))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_template",
    {
      title: "Get template",
      description: "One meme template: blank and example image URLs, line count.",
      inputSchema: z.object({
        id: z.string().describe("Template id, e.g. 'drake'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        const t = await getTemplate(id)
        return text(`${t.id} — ${t.name} (${t.lines} lines)${t.blank ? `\nBlank: ${t.blank}` : ""}${t.example ? `\nExample: ${t.example}` : ""}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_caption_fonts",
    {
      title: "List caption fonts",
      description: "Every caption font memegen.link can render with: font id, short alias and the font file behind it.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: list_caption_fonts ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_memegen_list_caption_fonts", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "random_quote",
    {
      title: "Random quote",
      description: "Fetch a random quote and its author from ZenQuotes, ready to use as meme caption text.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: random_quote ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_memegen_random_quote", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "template_styles",
    {
      title: "Template styles",
      description: "Discover a meme template's alternate visual styles and overlay slots, with preview URLs for each style.",
      inputSchema: z.object({ id: z.string().describe("Template id, for example drake.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: template_styles ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_memegen_template_styles", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof MemeError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
