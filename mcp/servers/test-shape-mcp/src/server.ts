import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectTestShape } from "./core.js"
import { checkTestConventions, ciWorkflows } from "./api.js"
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
    // TODO: implement source locally (paywall removed)
    try { return textError("Not yet implemented: source") } catch (e) { return textError(String(e)) }
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

  server.registerTool(
    "ci_workflows",
    {
      title: "CI workflow inventory",
      description: "Inventory the declared GitHub Actions workflows of a public repository and their enabled states.",
      inputSchema: z.object( { owner: z.string().min(1).max(100).describe("Public GitHub owner."), repo: z.string().min(1).max(100).describe("Public repository."), limit: z.number().int().min(1).max(30).optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ciWorkflows(args)) } catch (error) { return errorText(error) }
  }
  )

  server.registerTool(
    "ci_run_history",
    {
      title: "CI run history",
      description: "Inspect recent public GitHub Actions runs, triggers, outcomes and sampled conclusion counts.",
      inputSchema: z.object( { owner: z.string().min(1).max(100).describe("Public GitHub owner."), repo: z.string().min(1).max(100).describe("Public repository."), limit: z.number().int().min(1).max(30).optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement history locally (paywall removed)
    try { return textError("Not yet implemented: history") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "commit_checks",
    {
      title: "Commit checks",
      description: "Inspect check results and annotation counts on a public commit or branch, including checks from external test services.",
      inputSchema: z.object( { owner: z.string().min(1).max(100).describe("Public GitHub owner."), repo: z.string().min(1).max(100).describe("Public repository."), limit: z.number().int().min(1).max(30).optional(), ref: z.string().min(1).max(200).optional().describe("Commit SHA or branch; default HEAD.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement checks locally (paywall removed)
    try { return textError("Not yet implemented: checks") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
