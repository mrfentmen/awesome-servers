import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectTestShape } from "./core.js"
import { analyzeTestSource, checkTestConventions } from "./api.js"
import { premiumRequired } from "./license.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() {
  const server = new McpServer({ name: "test-shape-mcp", version: "1.0.0" })
  server.registerTool(
    "inspect_test_shape",
    {
      title: "Inspect test shape",
      description: "Audit local test structure using aggregate assertions without returning test names, paths, or source text.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).default(".") }),
      annotations: READ_ONLY,
    },
    async (input) => { try { return text(format(await inspectTestShape(input))) } catch (error) { return errorText(error) } }
  )
  server.registerTool(
    "analyze_test_source",
    {
      title: "Analyze test source",
      description: "Score test source you supply: describe and test structure, assertions per test, skipped and focused tests, table-driven and snapshot usage, empty bodies, hardcoded sleeps, nesting depth and a 0-100 quality score with the rubric shown. Test names, paths and source lines are never returned.",
      inputSchema: z.object( { source: z.string().min(1).max(400000).describe("Test source text to analyse, up to 400,000 characters.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: analyze_test_source ----
    const paywallMessage = await premiumRequired("analyze_test_source")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await analyzeTestSource(args)) } catch (error) { return errorText(error) }
  }
  )

  server.registerTool(
    "check_test_conventions",
    {
      title: "Check test conventions",
      description: "Run an eleven-rule style check over test source you supply: line endings, indentation, indent width, terminators, quote style, it versus test, callback style, trailing whitespace, blank-line runs, line length and final newline. Only counts and verdicts are returned.",
      inputSchema: z.object( { source: z.string().min(1).max(400000).describe("Test source text to check, up to 400,000 characters.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await checkTestConventions(args)) } catch (error) { return errorText(error) }
  }
  )

  return server
}
