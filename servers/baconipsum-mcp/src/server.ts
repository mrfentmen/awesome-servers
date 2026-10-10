import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { generate } from "./api.js"
import { premiumTool } from "./gateway.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "baconipsum-mcp", version: "1.0.0" })
  server.registerTool(
    "generate",
    {
      title: "Generate",
      description: "Generate placeholder text.",
      inputSchema: z.object( { type: z.string().describe("meat-and-filler or all-meat.").optional(), sentences: z.number().describe("Number of sentences.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await generate(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "paragraphs",
    {
      title: "Paragraphs",
      description: "Bacon Ipsum as real paragraph blocks rather than one blob, in JSON, HTML or plain text, with the optional traditional lorem opener. The type is checked here because the API answers with its default text for a type it does not know.",
      inputSchema: z.object( { paras: z.number().describe("How many paragraphs, 1-10. Defaults to 3.").optional(), type: z.string().describe("meat-and-filler or all-meat. Defaults to meat-and-filler.").optional(), startWithLorem: z.boolean().describe("Start with 'Bacon ipsum dolor amet' instead of random words.").optional(), format: z.string().describe("json, html or text. Defaults to json.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: paragraphs ----
    // The body runs on the gateway, behind the licence gate.
    try { return text(await premiumTool("mcp_baconipsum_paragraphs", args)) } catch (e) { return textError(error(e)) }
    // ---- paywall: end ----
  }
  )

  return server
}
