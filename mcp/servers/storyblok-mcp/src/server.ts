import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatStory, formatStoryDetail, getSpace, getStory, listStories, StoryblokError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "storyblok-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_space",
    {
      title: "Get space",
      description: "Storyblok space info: name, domain, plan.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await getSpace())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_stories",
    {
      title: "List stories",
      description: "Stories with slugs and publish dates, optionally under a folder.",
      inputSchema: z.object({
        starts_with: z.string().default("").describe("Folder slug, e.g. 'blog', empty = all"),
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ starts_with, limit }) => {
      try {
        const rows = await listStories(starts_with, limit)
        if (rows.length === 0) return text("No stories.")
        return text(rows.map((s, i) => formatStory(s, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_story",
    {
      title: "Get story",
      description: "One story: name, date, content keys.",
      inputSchema: z.object({
        slug: z.string().describe("Full slug, e.g. 'blog/hello'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ slug }) => {
      try {
        return text(formatStoryDetail(await getStory(slug)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof StoryblokError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
