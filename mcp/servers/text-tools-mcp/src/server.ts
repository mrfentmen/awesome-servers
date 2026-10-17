import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { base64, slugify, toCase, diffText } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "text-tools-mcp", version: "1.0.0" })
  server.registerTool(
    "slugify",
    {
      title: "Slugify",
      description: "Turn text into a URL slug.",
      inputSchema: z.object( { text: z.string().describe("Text to slugify.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await slugify(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "to_case",
    {
      title: "To case",
      description: "Convert text to a case.",
      inputSchema: z.object( { text: z.string().describe("Input text."), style: z.string().describe("camel, snake, kebab, or title.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await toCase(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "base64",
    {
      title: "Base64",
      description: "Encode or decode base64.",
      inputSchema: z.object( { text: z.string().describe("Input text."), decode: z.boolean().describe("Decode instead of encode.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await base64(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "text_metrics",
    {
      title: "Text metrics",
      description: "Measure a string: characters, graphemes, words, sentences, syllables, unique words, reading time and a Flesch readability score. All computed locally.",
      inputSchema: z.object( { text: z.string().describe("The text to measure, up to 200,000 characters.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement metrics locally (paywall removed)
    try { return textError("Not yet implemented: metrics") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "diff_text",
    {
      title: "Diff text",
      description: "Line diff of two strings with added, removed and unchanged markers, computed with a longest-common-subsequence comparison.",
      inputSchema: z.object( {
        before: z.string().describe("The original text.").optional(),
        after: z.string().describe("The changed text.").optional(),
        context: z.number().int().min(0).max(10).describe("Unchanged lines to keep around each change, 0-10, default 1.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await diffText(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "dictionary_lookup",
    {
      title: "Dictionary lookup",
      description: "Look up English definitions, pronunciation, parts of speech and usage examples in the public Free Dictionary API.",
      inputSchema: z.object( { word: z.string().min(1).max(100).describe("English word to look up."), limit: z.number().int().min(1).max(12).optional().describe("Maximum definitions; default 5.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement lookup locally (paywall removed)
    try { return textError("Not yet implemented: lookup") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
