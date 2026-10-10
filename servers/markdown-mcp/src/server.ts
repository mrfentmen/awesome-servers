import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { headings } from "./api.js"
import { toHtml, tableToMarkdown, checkDocument } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "markdown-mcp", version: "1.0.0" })
  server.registerTool(
    "to_html",
    {
      title: "To html",
      description: "Convert markdown to HTML.",
      inputSchema: z.object( { markdown: z.string().describe("Markdown text.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await toHtml(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "headings",
    {
      title: "Headings",
      description: "Extract the heading outline from markdown.",
      inputSchema: z.object( { markdown: z.string().describe("Markdown text.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await headings(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "table_to_markdown",
    {
      title: "Table to markdown",
      description: "Build a markdown pipe table from headers and rows, with optional per-column alignment and automatic pipe escaping, which is the one markdown shape you always have to hand write.",
      inputSchema: z.object( { headers: z.array(z.string()).describe("Column headers."), rows: z.array(z.array(z.string())).describe("Rows of cells."), align: z.array(z.string()).describe("left, center, right per column.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: table_to_markdown ----
    const paywallMessage = await premiumRequired("table_to_markdown")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await tableToMarkdown(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "check_document",
    {
      title: "Check document",
      description: "Lint a markdown document for heading jumps, unclosed code fences and missing top level heading, which the heading and html tools never check for.",
      inputSchema: z.object( { markdown: z.string().describe("The markdown document."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: check_document ----
    const paywallMessage = await premiumRequired("check_document")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await checkDocument(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
