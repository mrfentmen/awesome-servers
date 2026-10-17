import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { character, emojiSearch, format, searchBlocks } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorMessage = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "unicode-mcp", version: "1.0.0" })
  server.registerTool(
    "get_character",
    {
      title: "Get character",
      description: "Get official UnicodeData metadata for a code point such as U+1F600 or 0041.",
      inputSchema: z.object( { codePoint: z.string().min(1).max(12) }),
      annotations: READ_ONLY,
    },
    async ({ codePoint }) => {
    try { const result = await character(codePoint); return text(result ? format(result) : `No UnicodeData entry found for ${codePoint}.`) } catch (error) { return errorText(error) }
  }
  )
  server.registerTool(
    "search_blocks",
    {
      title: "Search blocks",
      description: "Search official Unicode block names and ranges.",
      inputSchema: z.object( { query: z.string().min(1).max(100) }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
    try { return text(format(await searchBlocks(query))) } catch (error) { return errorText(error) }
  }
  )
  server.registerTool(
    "search_emoji",
    {
      title: "Search emoji",
      description: "Search the official Unicode emoji test data by annotation or emoji name.",
      inputSchema: z.object( { query: z.string().min(1).max(100) }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
    try { return text(format(await emojiSearch(query))) } catch (error) { return errorText(error) }
  }
  )
  server.registerTool(
    "get_character_age",
    {
      title: "Get character age",
      description: "Find the Unicode version that first assigned a code point, from the official DerivedAge data.",
      inputSchema: z.object({ codePoint: z.string().min(1).max(12).describe("Code point such as U+1F600, 1F600 or 0041.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement age locally (paywall removed)
    try { return textError("Not yet implemented: age") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "check_normalization",
    {
      title: "Check normalization",
      description: "Report the NFC, NFD, NFKC and NFKD forms of a code point as recorded in the official NormalizationTest conformance data.",
      inputSchema: z.object({ codePoint: z.string().min(1).max(12).describe("Code point such as U+00C5, 00C5 or 1E9B.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement normalization locally (paywall removed)
    try { return textError("Not yet implemented: normalization") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "search_named_sequences",
    {
      title: "Search named sequences",
      description: "Find official Unicode names for sequences of multiple code points, with their constituent code points.",
      inputSchema: z.object({ query: z.string().min(1).max(100).describe("Part of a sequence name, such as LATIN."), limit: z.number().int().min(1).max(30).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement sequences locally (paywall removed)
    try { return textError("Not yet implemented: sequences") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
