import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { diffText } from "./api.js"
import { unifiedDiff, diffStats, structuredDiff, inlineDiff, applyPatchText } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "diff-mcp", version: "1.0.0" })
  server.registerTool(
    "diff_text",
    {
      title: "Diff text",
      description: "Show the diff between two texts.",
      inputSchema: z.object( { a: z.string().describe("Original text."), b: z.string().describe("New text.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await diffText(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "unified_diff",
    {
      title: "Unified diff",
      description: "Show a unified diff between two texts.",
      inputSchema: z.object( { a: z.string().describe("Original text."), b: z.string().describe("New text."), context: z.number().describe("Context lines.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await unifiedDiff(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "diff_stats",
    {
      title: "Diff stats",
      description: "Measure a change instead of printing it: how many lines and characters were added and removed, how many stayed, the line delta, how many hunks the change splits into and their sizes, the share of the original left in place, and the longest single run of added or removed lines with the line it starts at. The diff_text tool caps its output at 200 lines and unified_diff at 8000 characters, so on a large change they show a prefix rather than the shape.",
      inputSchema: z.object( { a: z.string().describe("Original text."), b: z.string().describe("New text.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: diff_stats ----
    const paywallMessage = await premiumRequired("diff_stats")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await diffStats(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "structured_diff",
    {
      title: "Structured diff",
      description: "Compare two JSON or YAML documents key by key rather than line by line: which keys were added, removed or changed and at what path, including inside nested objects and arrays, with a fallback to a word level diff when neither side is a structured document. A reformatting shows as no change at all here, where a line diff shows a wholesale rewrite.",
      inputSchema: z.object( { a: z.string().describe("Original JSON or YAML document."), b: z.string().describe("Changed JSON or YAML document.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await structuredDiff(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "inline_diff",
    {
      title: "Inline diff",
      description: "Word-level diff of two texts: the changed words marked inside the line with - removed and + added, with elisions instead of the silent truncation diff_text and unified_diff apply, plus a tally of words added, removed and unchanged.",
      inputSchema: z.object( { a: z.string().describe("Original text."), b: z.string().describe("New text."), context: z.number().int().describe("Unchanged words kept either side of each change.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: inline_diff ----
    const paywallMessage = await premiumRequired("inline_diff")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await inlineDiff(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "apply_patch",
    {
      title: "Apply patch",
      description: "Apply a unified diff to a source text and report which hunks applied and which did not. The other tools all read a pair of texts; this one turns a patch back into text.",
      inputSchema: z.object( { source: z.string().describe("The text the patch was made against."), patch: z.string().describe("A unified diff.").default("") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await applyPatchText(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
