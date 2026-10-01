import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { explainEvidence, format } from "./evidence.js"
import { testEvidence, commitEvidence } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "evidence-diff-mcp", version: "1.0.0" })
  server.registerTool(
    "explain_change_evidence",
    {
      title: "Explain change evidence",
      description: "Explain coarse changes in local Git and test-build evidence without returning source diffs, file contents, or secrets.",
      inputSchema: z.object(
    { project: z.string().min(1).max(1000).describe("Local Git project directory; no URLs") }),
      annotations: READ_ONLY,
    },
    async ({ project }) => {
      try { return text(format(await explainEvidence(project))) } catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "test_evidence_inventory",
    {
      title: "Test evidence inventory",
      description: "Walk a local project's tree and count the test and build evidence files by what they actually are: test sources, end to end specs, feature files, snapshots, junit style reports, coverage files and build output, each broken down by extension, plus the tree's most common extensions overall. The explain tool only classifies top level directory names, so anything inside a subdirectory is invisible to it.",
      inputSchema: z.object({ project: z.string().min(1).max(1000).describe("Local Git project directory; no URLs"), max_files: z.number().min(50).max(20000).describe("Stop after examining this many files.").optional() }),
      annotations: READ_ONLY,
    },
    async ({ project, max_files }) => {
      try { return text(await testEvidence({ project, max_files })) } catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "commit_history_evidence",
    {
      title: "Commit history evidence",
      description: "Summarise a local project's commit history as counts and dates: how many commits, how many merges, how many subjects begin with a fix word without printing any subject, the oldest and newest dates, the number of distinct active days, the average per active day, and the commits by weekday and by month. The explain tool counts only the last five commits and prints no dates at all.",
      inputSchema: z.object({ project: z.string().min(1).max(1000).describe("Local Git project directory; no URLs"), limit: z.number().min(10).max(10000).describe("How many commits to read, up to 10000.").optional() }),
      annotations: READ_ONLY,
    },
    async ({ project, limit }) => {
      // ---- paywall: commit_history_evidence ----
      const paywallMessage = await premiumRequired("commit_history_evidence")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await commitEvidence({ project, limit })) } catch (error) { return errorText(error) }
    }
  )
  return server
}
