import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { analyzeText, compareLookalikes, skeleton } from "./security.js"

import { characterDecomposition, codePointInfo } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorMessage = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer() {
  const server = new McpServer({ name: "unicode-security-mcp", version: "1.0.0" })
  server.registerTool(
    "analyze_text",
    {
      title: "Analyze text",
      description: "Analyze text locally for Unicode confusables, mixed scripts, invisible controls, and a heuristic risk score. Input is never sent anywhere.",
      inputSchema: z.object( { text: z.string().max(10000) }),
      annotations: READ_ONLY,
    },
    async ({ text: value }) => text(JSON.stringify(analyzeText(value), null, 2))
  )
  server.registerTool(
    "compare_identifiers",
    {
      title: "Compare identifiers",
      description: "Compare two identifiers using a Unicode-aware confusable skeleton. This is a warning aid, not a complete security proof.",
      inputSchema: z.object( { left: z.string().min(1).max(500), right: z.string().min(1).max(500) }),
      annotations: READ_ONLY,
    },
    async ({ left, right }) => text(JSON.stringify(compareLookalikes(left, right), null, 2))
  )
  server.registerTool(
    "get_skeleton",
    {
      title: "Get skeleton",
      description: "Return a local normalized confusable skeleton for one identifier.",
      inputSchema: z.object( { value: z.string().max(500) }),
      annotations: READ_ONLY,
    },
    async ({ value }) => text(skeleton(value))
  )
  server.registerTool(
    "code_point_info",
    {
      title: "Code point info",
      description: "The Unicode Character Database's own record for one code point: official name, general category, combining class, bidi class, and its TR39 skeleton. Only the code point is sent; the tables are fetched once and cached.",
      inputSchema: z.object( { codePoint: z.string().min(1).max(16).describe("A code point, e.g. '0430', 'U+0430', '0x202E', or the character itself.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await codePointInfo(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "confusable_family",
    {
      title: "Confusable family",
      description: "Every character Unicode's TR39 confusables table maps to the same skeleton as this one — the full confusable set, not the server's short local list. Only the code point is sent.",
      inputSchema: z.object( { character: z.string().min(1).max(16).describe("A character or code point, e.g. '0430' or 'U+0430'."), limit: z.number().int().describe("Max confusables to list.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: confusable_family ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_unicode_security_confusable_family", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "character_decomposition",
    {
      title: "Character decomposition",
      description: "The canonical or compatibility decomposition Unicode records for a code point, each step named, and whether normalization can put it back together. Only the code point is sent.",
      inputSchema: z.object( { codePoint: z.string().min(1).max(16).describe("A code point, e.g. 'FB01' or 'U+FB01'.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await characterDecomposition(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
