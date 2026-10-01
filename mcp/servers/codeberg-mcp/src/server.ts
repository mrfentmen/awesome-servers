import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search } from "./api.js"
import { version, repoDetail, repoBranches, repoCommits, repoIssues, repoReleases, userOverview, fileContents } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "codeberg-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Codeberg repositories.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "version",
    {
      title: "Version",
      description: "Codeberg server version.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await version(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "repo_detail",
    {
      title: "Repository detail",
      description: "Full metadata for one Codeberg repository: stars, forks, open issues, default branch, licence and size.",
      inputSchema: z.object( { owner: z.string().describe("Repository owner."), repo: z.string().describe("Repository name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await repoDetail(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "repo_branches",
    {
      title: "Repository branches",
      description: "Every branch in a Codeberg repository with its latest commit id and date.",
      inputSchema: z.object( { owner: z.string().describe("Repository owner."), repo: z.string().describe("Repository name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await repoBranches(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "repo_commits",
    {
      title: "Recent commits",
      description: "Recent commits in a Codeberg repository: sha, date, author and subject line.",
      inputSchema: z.object( { owner: z.string().describe("Repository owner."), repo: z.string().describe("Repository name."), limit: z.number().describe("Max commits.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await repoCommits(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "repo_issues",
    {
      title: "Repository issues",
      description: "Issues in a Codeberg repository, filtered by open, closed or all, with labels and comment counts.",
      inputSchema: z.object( { owner: z.string().describe("Repository owner."), repo: z.string().describe("Repository name."), state: z.string().describe("open, closed or all.").optional(), limit: z.number().describe("Max issues.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await repoIssues(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "repo_releases",
    {
      title: "Repository releases",
      description: "Releases in a Codeberg repository: tag, publish date and link, with prerelease and draft flags.",
      inputSchema: z.object( { owner: z.string().describe("Repository owner."), repo: z.string().describe("Repository name."), limit: z.number().describe("How many releases, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await repoReleases(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "user_overview",
    {
      title: "User overview",
      description: "A Codeberg user's profile: display name, bio, follower counts, join date and location.",
      inputSchema: z.object( { user: z.string().describe("Codeberg user name, e.g. 'forgejo'.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await userOverview(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "file_contents",
    {
      title: "File contents",
      description: "Read one file from a Codeberg repository at its default branch, decoded as text.",
      inputSchema: z.object( { owner: z.string().describe("Repository owner."), repo: z.string().describe("Repository name."), path: z.string().describe("File path, e.g. 'README.md'.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: file_contents ----
    const paywallMessage = await premiumRequired("file_contents")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await fileContents(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
