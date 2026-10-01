import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { DuolingoError, formatProfile, getProfile } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "duolingo-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_profile",
    {
      title: "Get profile",
      description: "A public Duolingo profile: streak, XP, courses, achievements.",
      inputSchema: z.object({
        username: z.string().describe("Duolingo username"),
      }),
      annotations: READ_ONLY,
    },
    async ({ username }) => {
      try {
        return text(formatProfile(await getProfile(username)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "profile_details",
    {
      title: "Profile details",
      description: "The account side of a public Duolingo profile: join date, verified email, " +
      "Duolingo Plus, current course, interface and base language, motivation and roles.",
      inputSchema: z.object({
        username: z.string().describe("Duolingo username"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: profile_details ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_duolingo_profile_details", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "course_catalog",
    {
      title: "Course catalog",
      description: "Duolingo's public course catalog with language pair, learner count and course phase.",
      inputSchema: z.object({ search: z.string().describe("Filter by language name or code.").optional(), limit: z.number().describe("Maximum courses, 1-50.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: course_catalog ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_duolingo_course_catalog", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof DuolingoError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
