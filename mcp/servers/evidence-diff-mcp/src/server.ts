import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { explainEvidence, format } from "./evidence.js"
import { testEvidence, commitEvidence } from "./local-api.js"

import { premiumTool } from "./gateway.js"
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
      try { return text(await commitEvidence({ project, limit })) } catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "public_revision_evidence",
    {
      title: "Public revision evidence",
      description: "Compare two public GitHub revisions using relationship, commit counts and bounded file-change totals, without returning source diffs.",
      inputSchema: z.object({ owner: z.string().min(1).max(100).default("nodejs").describe("Public GitHub owner."), repo: z.string().min(1).max(100).default("node").describe("Public GitHub repository."), base: z.string().min(1).max(200).default("v22.0.0"), head: z.string().min(1).max(200).default("v22.1.0") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: public_revision_evidence ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_evidence_diff_public_revision_evidence", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "public_check_evidence",
    {
      title: "Public check evidence",
      description: "Fetch public GitHub commit check statuses and conclusions without returning check names, logs or annotations.",
      inputSchema: z.object({ owner: z.string().min(1).max(100).default("microsoft").describe("Public GitHub owner."), repo: z.string().min(1).max(100).default("TypeScript").describe("Public GitHub repository."), ref: z.string().min(1).max(200).default("main"), limit: z.number().optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: public_check_evidence ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_evidence_diff_public_check_evidence", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}

function error(e: unknown): string { return e instanceof Error ? e.message : String(e) }
