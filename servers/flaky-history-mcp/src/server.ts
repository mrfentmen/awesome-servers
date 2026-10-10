import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { analyzeHistory, format } from "./history.js"
import { historyCohortSpread, historyFlapPatterns } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "flaky-history-mcp", version: "1.0.0" })
  server.registerTool(
    "analyze_test_history",
    {
      title: "Analyze test history",
      description: "Aggregate local test history into stability signals without returning test names, file names, raw records, or exact versions.",
      inputSchema: z.object(
    { project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
      annotations: READ_ONLY,
    },
    async ({ project }) => {
      try { return text(format(await analyzeHistory(project))) } catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "history_cohort_spread",
    {
      title: "History cohort spread",
      description: "Split local history files into per-file cohorts and report how failure is distributed between them: mean and median cohort failure rate, dispersion, a rate histogram, cohort size statistics and concentration. No test names, file names, paths or raw records are returned.",
      inputSchema: z.object(
    { project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: history_cohort_spread ----
    const paywallMessage = await premiumRequired("history_cohort_spread")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await historyCohortSpread(args)) } catch (error) { return errorText(error) }
  }
  )

  server.registerTool(
    "history_flap_patterns",
    {
      title: "History flap patterns",
      description: "Analyse outcome sequencing inside each local history file and report flip rates, the longest pass-fail alternation and how many cohorts are genuinely flapping. Only cohort indices and formats are shown, never test names, file names or records.",
      inputSchema: z.object(
    { project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await historyFlapPatterns(args)) } catch (error) { return errorText(error) }
  }
  )

  return server
}
