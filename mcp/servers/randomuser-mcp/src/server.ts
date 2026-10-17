import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_users, m1_generate, m1_seed } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'randomuser-mcp', version: '1.0.0' })
server.registerTool(
    "users",
    {
      title: "Users",
      description: "Random user profiles.",
      inputSchema: z.object( { count: z.number().describe("Number of users.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_users(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "generate",
    {
      title: "Generate",
      description: "Generate random user profiles.",
      inputSchema: z.object( { count: z.number().describe("How many profiles.").optional(), gender: z.string().describe("male, female, or any.").optional(), nat: z.string().describe("Nationality code, for example us or gb.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_generate(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "seed",
    {
      title: "Seed",
      description: "Generate the same profiles every time with a seed.",
      inputSchema: z.object( { seed: z.string().describe("Seed value."), count: z.number().describe("How many profiles.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_seed(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "field_subset",
    {
      title: "Field subset",
      description: "Random user profiles limited to the fields you name, or with fields excluded, so you can fill a form without pulling everything.",
      inputSchema: z.object( { count: z.number().describe("How many profiles.").optional(), include: z.string().describe("Comma-separated fields to include, e.g. name,email,login.").optional(), exclude: z.string().describe("Comma-separated fields to exclude, e.g. phone,location.").optional(), nat: z.string().describe("Nationality code, for example us or gb.").optional(), gender: z.string().describe("male or female.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement subset locally (paywall removed)
    try { return textError("Not yet implemented: subset") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
