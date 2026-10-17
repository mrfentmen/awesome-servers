import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { generate, inscriptionMetrics } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "inspirobot-mcp", version: "1.0.0" })
  server.registerTool(
    "generate",
    {
      title: "Generate",
      description: "One generated inspirational quote image URL.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await generate(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "generate_styled",
    {
      title: "Generate styled poster",
      description: "Render a poster with an inscription you supply plus font, script, alignment, line spacing and character spacing, then follow the returned URL to confirm the image is live and report its real content type and byte length.",
      inputSchema: z.object( { inscription: z.string().describe("Text to put on the poster, up to 200 characters."), font: z.string().describe("Font name. The service falls back silently on an unknown name.").optional(), script: z.string().describe("Script name.").optional(), align: z.number().describe("Alignment, 0-3.").optional(), lineSpacing: z.number().describe("Line spacing, 0-400.").optional(), charSpacing: z.number().describe("Character spacing, -50 to 200.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement styled locally (paywall removed)
    try { return textError("Not yet implemented: styled") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "font_matrix",
    {
      title: "Font matrix",
      description: "Render the same short inscription across up to four font names and measure each generated file, so you can see what each name actually produces rather than trusting it.",
      inputSchema: z.object( { inscription: z.string().describe("Short text to render, default 'measure this'.").optional(), fonts: z.string().describe("Comma separated font names, up to 4.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement matrix locally (paywall removed)
    try { return textError("Not yet implemented: matrix") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "inscription_metrics",
    {
      title: "Inscription metrics",
      description: "Check an inscription locally before spending a render: character and word counts, the longest word, how it would wrap at a width you choose, and which characters fall outside printable ASCII. No network call, no image generated.",
      inputSchema: z.object( { inscription: z.string().describe("Text to measure."), charsPerLine: z.number().describe("Characters per line for the wrap estimate, 4-200.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await inscriptionMetrics(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
