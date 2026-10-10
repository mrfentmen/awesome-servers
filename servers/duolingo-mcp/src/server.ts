import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { DuolingoError, formatProfile, getProfile, profileDetails, courseCatalog, profileCourses, profileAchievements, profileSummary } from "./api.js"
import { premiumRequired } from "./license.js"

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
    async ({ username }) => {
      // ---- paywall: profile_details ----
      const paywallMessage = await premiumRequired("profile_details")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await profileDetails({ username }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "course_catalog",
    {
      title: "Course catalog",
      description: "List Duolingo's public language course catalog with learner counts and course phases.",
      inputSchema: z.object({ limit: z.number().int().optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await courseCatalog(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "profile_courses",
    {
      title: "Profile courses",
      description: "List every public course on a Duolingo user's profile with XP and crowns.",
      inputSchema: z.object({ username: z.string().describe("Public Duolingo username.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await profileCourses(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "profile_achievements",
    {
      title: "Profile achievements",
      description: "List achievements reported on a public Duolingo profile.",
      inputSchema: z.object({ username: z.string().describe("Public Duolingo username.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await profileAchievements(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "profile_summary",
    {
      title: "Profile summary",
      description: "Summarize public identity and totals for a Duolingo user.",
      inputSchema: z.object({ username: z.string().describe("Public Duolingo username.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await profileSummary(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof DuolingoError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
