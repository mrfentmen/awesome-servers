import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { repo } from "./api.js"
import { searchRepos } from "./api.js"
import { userRepos, repoLanguages, repoReleases, repoContributors, userProfile } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "github-intel-mcp", version: "1.0.0" })
  server.registerTool(
    "search_repos",
    {
      title: "Search repos",
      description: "Search GitHub repositories by query sorted by stars.",
      inputSchema: z.object( { query: z.string().describe("Search query."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchRepos(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get_repo",
    {
      title: "Get repo",
      description: "Get details for one repository.",
      inputSchema: z.object( { owner: z.string().describe("Owner name."), repo: z.string().describe("Repository name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await repo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get_user_repos",
    {
      title: "Get user repos",
      description: "List repositories for a GitHub user.",
      inputSchema: z.object( { username: z.string().describe("GitHub username."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await userRepos(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "repo_languages",
    {
      title: "Repo languages",
      description: "The real language mix of a repository, by the bytes GitHub counts, with each language's share and the repository's own primary language field.",
      inputSchema: z.object( { owner: z.string().describe("Owner name."), repo: z.string().describe("Repository name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: repo_languages ----
    const paywallMessage = await premiumRequired("repo_languages")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await repoLanguages(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "repo_releases",
    {
      title: "Repo releases",
      description: "Recent releases of a repository: tag, publish date, prerelease and draft flags, asset count and download total, and a bounded slice of the release notes.",
      inputSchema: z.object( { owner: z.string().describe("Owner name."), repo: z.string().describe("Repository name."), limit: z.number().describe("Max releases, 1-25.").optional(), notes: z.number().describe("Characters of release notes to keep per release, 0-2000.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await repoReleases(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "repo_contributors",
    {
      title: "Repo contributors",
      description: "Who carries a repository: the top contributors by commit count with each one's share of the page, and how concentrated the top two are.",
      inputSchema: z.object( { owner: z.string().describe("Owner name."), repo: z.string().describe("Repository name."), limit: z.number().describe("Max contributors, 1-50.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: repo_contributors ----
    const paywallMessage = await premiumRequired("repo_contributors")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await repoContributors(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "user_profile",
    {
      title: "User profile",
      description: "A GitHub account in full: display name, account type, join date and age, public repository and follower counts, company, location, website and bio.",
      inputSchema: z.object( { username: z.string().describe("GitHub username.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await userProfile(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
