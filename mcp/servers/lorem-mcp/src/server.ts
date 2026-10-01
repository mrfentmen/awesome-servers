import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { generate } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "lorem-mcp", version: "1.0.0" })
  server.registerTool(
    "generate",
    {
      title: "Generate",
      description: "Generate lorem ipsum text.",
      inputSchema: z.object( { paragraphs: z.number().describe("Number of paragraphs.").optional(), words_per_paragraph: z.number().describe("Words per paragraph.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await generate(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "html_text",
    {
      title: "Html text",
      description: "Lorem ipsum paragraphs wrapped in real html elements with an optional heading, which is what a layout mockup or component test needs.",
      inputSchema: z.object( { paragraphs: z.number().describe("How many paragraphs.").optional(), words_per_paragraph: z.number().describe("Words per paragraph.").optional(), heading: z.string().describe("Heading text.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: html_text ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_lorem_html_text", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "json_filler",
    {
      title: "Json filler",
      description: "Lorem ipsum records shaped like a real API response, with ids, timestamps, counts and booleans guessed from the field names, for wiring a frontend before the backend exists.",
      inputSchema: z.object( { count: z.number().describe("How many records.").optional(), fields: z.array(z.string()).describe("Field names, e.g. id, title, createdAt.").optional(), seedWord: z.string().describe("Recorded alongside the rows.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: json_filler ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_lorem_json_filler", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
