import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { DuolingoError, formatProfile, getProfile, profileDetails } from "./api.js"
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

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof DuolingoError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
