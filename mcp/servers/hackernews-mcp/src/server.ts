import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { hitText, HnError, ids, item, itemText, search, user } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof HnError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

async function feed(kind: "topstories" | "newstories" | "beststories", limit: number): Promise<string> {
  const list = await ids(kind, limit)
  const rows: string[] = []
  for (const id of list) {
    const it = await item(id)
    if (it) rows.push(itemText(it))
  }
  return rows.length ? rows.join("\n\n") : "No stories returned."
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "hackernews-mcp", version: "1.0.0" })

  server.tool(
    "top_stories",
    "Current Hacker News front page.",
    { limit: z.number().int().min(1).max(30).default(10).describe("Stories") },
    async ({ limit }) => {
      try {
        return text(await feed("topstories", limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "new_stories",
    "Newest Hacker News submissions.",
    { limit: z.number().int().min(1).max(30).default(10).describe("Stories") },
    async ({ limit }) => {
      try {
        return text(await feed("newstories", limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "best_stories",
    "Hacker News best stories of the recent window.",
    { limit: z.number().int().min(1).max(30).default(10).describe("Stories") },
    async ({ limit }) => {
      try {
        return text(await feed("beststories", limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "item_detail",
    "One story or comment by id.",
    { id: z.number().int().positive().describe("HN item id") },
    async ({ id }) => {
      try {
        const it = await item(id)
        return text(it ? itemText(it) : `No item ${id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "user_profile",
    "Karma, join date, about text and submission count for a HN user.",
    { id: z.string().min(1).describe("HN username, case-sensitive") },
    async ({ id }) => {
      try {
        const u = await user(id)
        if (!u) return text(`No user "${id}".`)
        return text(
          [
            `user: ${u.id}`,
            `karma: ${u.karma ?? 0}`,
            `joined: ${u.created ? new Date(u.created * 1000).toISOString().slice(0, 10) : "?"}`,
            `submissions: ${u.submitted?.length ?? 0}`,
            u.about ? `about: ${u.about.replace(/<[^>]+>/g, "")}` : "",
          ]
            .filter(Boolean)
            .join("\n")
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search",
    "Full-text Hacker News search. tags=story for stories, comment for comments, ask_hn/show_hn for those.",
    {
      query: z.string().min(1).describe("Search terms"),
      tags: z.string().default("story").describe("story, comment, ask_hn, show_hn or a combination"),
      limit: z.number().int().min(1).max(30).default(10).describe("Hits"),
    },
    async ({ query, tags, limit }) => {
      try {
        const hits = await search(query, tags, limit)
        return text(hits.length ? hits.map(hitText).join("\n\n") : "No hits.")
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
