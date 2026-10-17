import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { matches, testRegex } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "regex-mcp", version: "1.0.0" })
  server.registerTool(
    "test",
    {
      title: "Test",
      description: "Test a regular expression against a string.",
      inputSchema: z.object( { pattern: z.string().describe("Regular expression."), input: z.string().describe("String to test.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await testRegex(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "matches",
    {
      title: "Matches",
      description: "Return all matches of a pattern in a string.",
      inputSchema: z.object( { pattern: z.string().describe("Regular expression."), input: z.string().describe("String to search."), limit: z.number().describe("Max matches.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await matches(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "replace_preview",
    {
      title: "Replace preview",
      description: "Apply a regular expression replacement to a text and show every match with its index and groups, plus the result, which is how you test a rewrite before running it.",
      inputSchema: z.object( { pattern: z.string().describe("Regular expression."), replacement: z.string().describe("Replacement text.").optional(), input: z.string().describe("Text to search.").optional(), flags: z.string().describe("Flags such as gi.").optional(), limit: z.number().describe("Max matches listed.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement preview locally (paywall removed)
    try { return textError("Not yet implemented: preview") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "extract_groups",
    {
      title: "Extract groups",
      description: "Turn a text into structured records by running a regular expression with capture groups, which is how a log becomes data.",
      inputSchema: z.object( { pattern: z.string().describe("Regular expression with capture groups."), input: z.string().describe("Text to search.").optional(), flags: z.string().describe("Flags such as g.").optional(), limit: z.number().describe("Max records.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement groups locally (paywall removed)
    try { return textError("Not yet implemented: groups") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
