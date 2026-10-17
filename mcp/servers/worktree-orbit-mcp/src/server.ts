import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectTopology } from "./orbit.js"
import { worktreeAgeProfile, worktreeDivergenceProfile } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : "Local worktree inspection failed"}`)
export function createServer() { const server = new McpServer({ name: "worktree-orbit-mcp", version: "1.0.0" }); server.registerTool(
    "inspect_worktree_topology",
    {
      title: "Inspect worktree topology",
      description: "Summarize local Git worktree topology, clean or dirty state, detached worktrees, locks, and prunable entries without exposing paths, branch names, hashes, remotes, or content.",
      inputSchema: z.object( { cwd: z.string().min(1).max(1000).default(".").describe("Local Git repository path; no network access is used.") }),
      annotations: READ_ONLY,
    },
    async ({ cwd }) => { try { return text(format(await inspectTopology(cwd))) } catch (error) { return errorText(error) } }
  );
  server.registerTool(
    "worktree_divergence_profile",
    {
      title: "Worktree divergence profile",
      description: "Measure every linked Git worktree against the primary HEAD and report commits ahead and behind, clean or dirty state and an in-sync, ahead-only, behind-only or diverged verdict per worktree index. Paths, branch names and hashes are never returned.",
      inputSchema: z.object( { cwd: z.string().min(1).max(1000).default(".").describe("Local Git repository path; no network access is used.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await worktreeDivergenceProfile(args)) } catch (error) { return errorText(error) }
  }
  ); server.registerTool(
    "worktree_age_profile",
    {
      title: "Worktree age profile",
      description: "Bucket every local Git worktree by the age of its administrative metadata, flag locked and prunable entries, and count how many look abandoned at 30 days or more. Paths, branch names and contents are never returned.",
      inputSchema: z.object( { cwd: z.string().min(1).max(1000).default(".").describe("Local Git repository path; no network access is used.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await worktreeAgeProfile(args)) } catch (error) { return errorText(error) }
  }
  );; return server }
