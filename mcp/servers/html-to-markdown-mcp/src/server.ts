import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { convert, convertUrl, extractLinks } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "html-to-markdown-mcp", version: "1.0.0" })
  server.registerTool(
    "convert",
    {
      title: "Convert",
      description: "Convert HTML to markdown.",
      inputSchema: z.object( { html: z.string().describe("HTML text."), max_length: z.number().describe("Max output length.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await convert(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "convert_url",
    {
      title: "Convert url",
      description: "Fetch a page over http or https and convert it to markdown, so a web page can be read as clean text without a copy-paste step.",
      inputSchema: z.object( { url: z.string().describe("Page url, e.g. https://example.com/article."), max_length: z.number().describe("Max markdown characters.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await convertUrl(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "extract_links",
    {
      title: "Extract links",
      description: "List every outbound link and image on a page, split into internal and external, resolved against the page url so relative hrefs become absolute.",
      inputSchema: z.object( { url: z.string().describe("Page url."), limit: z.number().describe("Max links per group.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await extractLinks(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
