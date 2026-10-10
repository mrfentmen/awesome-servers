import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, summarizeReleaseHistory } from "./core.js"
import { reviewChangelogCoverage } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() {
  const server = new McpServer({ name: "release-notes-forge-mcp", version: "1.0.0" })
  server.registerTool(
    "summarize_release_history",
    {
      title: "Summarize release history",
      description: "Summarize local Git release shape without returning commit messages, paths, hashes, or remotes.",
      inputSchema: z.object( { cwd: z.string().min(1).max(1000).default(".") }),
      annotations: READ_ONLY,
    },
    async (input) => { try { return text(format(await summarizeReleaseHistory(input))) } catch (error) { return errorText(error) } }
  )
  server.registerTool(
    "draft_release_digest",
    {
      title: "Draft release digest",
      description: "Turn commit subjects you supply into a release digest: conventional-type histogram, breaking-change count, distinct scope count, subject-length check, a suggested Keep a Changelog section order and a recommended semver impact. Subject text, scope labels and author identities are never returned.",
      inputSchema: z.object( { subjects: z.array(z.string().max(1000)).min(1).max(500).describe("Commit subject lines, up to 500 of 1000 characters each.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: draft_release_digest ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_release_notes_forge_draft_release_digest", args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "review_changelog_coverage",
    {
      title: "Review changelog coverage",
      description: "Audit changelog text you supply: release and unreleased heading counts, entry counts, conventional-type coverage, per-section entry counts, duplicate entries, missing or empty Keep a Changelog sections and a releasability verdict. Entry text is never returned.",
      inputSchema: z.object( { changelog: z.string().min(1).max(200000).describe("Changelog text to review, up to 200,000 characters.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await reviewChangelogCoverage(args)) } catch (error) { return errorText(error) }
  }
  )

  return server
}
