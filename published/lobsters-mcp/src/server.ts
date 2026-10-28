import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { byTag, domainBreakdown, hottest, LobstersError, newest, storyDetail, userInfo } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof LobstersError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "lobsters-mcp", version: "1.0.3" })

  server.tool(
    "hottest",
    "The current lobste.rs front page.",
    { limit: z.number().int().min(1).max(25).default(10).describe("Stories to return") },
    async ({ limit }) => {
      try {
        return text(await hottest(limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "newest",
    "Freshly submitted lobste.rs stories.",
    { limit: z.number().int().min(1).max(25).default(10).describe("Stories to return") },
    async ({ limit }) => {
      try {
        return text(await newest(limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "by_tag",
    "Stories under one tag, e.g. rust, ai, security, programming.",
    {
      tag: z.string().min(2).describe("Tag name"),
      limit: z.number().int().min(1).max(25).default(10).describe("Stories to return"),
    },
    async ({ tag, limit }) => {
      try {
        return text(await byTag(tag, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "story_detail",
    "One story by its short id.",
    { short_id: z.string().min(4).describe("Short id, e.g. olnqh2") },
    async ({ short_id }) => {
      try {
        return text(await storyDetail(short_id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "user_info",
    "Profile, karma and activity counts for a lobste.rs user.",
    { username: z.string().min(2).describe("Username") },
    async ({ username }) => {
      try {
        return text(await userInfo(username))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "domain_breakdown",
    "Which sites and tags dominate the current front page.",
    { limit: z.number().int().min(1).max(25).default(10).describe("Domains to list") },
    async ({ limit }) => {
      try {
        return text(await domainBreakdown(limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
