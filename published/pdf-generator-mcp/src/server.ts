import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { createPdf } from "./api.js"
import { createReport, urlToPdf } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "pdf-generator-mcp", version: "1.0.0" })
  server.registerTool(
    "create_pdf",
    {
      title: "Create pdf",
      description: "Create a PDF file with a title and body text.",
      inputSchema: z.object( { title: z.string().describe("Document title."), body: z.string().describe("Body text."), filename: z.string().describe("Output file name.").optional() }),
      annotations: WRITE,
    },
    async (args) => {
    try { return text(await createPdf(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "create_report",
    {
      title: "Create report",
      description: "Create a simple report PDF with a title, author, and bullet lines.",
      inputSchema: z.object( { title: z.string().describe("Report title."), author: z.string().describe("Author name.").optional(), bullets: z.string().describe("Comma separated bullet lines.").optional() }),
      annotations: WRITE,
    },
    async (args) => {
    try { return text(await createReport(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "url_to_pdf",
    {
      title: "Url to pdf",
      description: "Fetch a page over http or https, strip the markup down to its readable text and render it into a pdf file, which saves a print-to-pdf step.",
      inputSchema: z.object( { url: z.string().describe("Page url, e.g. https://example.com/article."), title: z.string().describe("Override the pdf title.").optional(), maxChars: z.number().describe("Max characters of text to render.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: url_to_pdf ----
    const paywallMessage = await premiumRequired("url_to_pdf")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await urlToPdf(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
