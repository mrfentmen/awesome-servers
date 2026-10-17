import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { m0_fact, m1_randomFact, dailyFact } from './api.js'

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'uselessfacts-mcp', version: '1.0.0' })
server.registerTool(
    "fact",
    {
      title: "Fact",
      description: "Random useless fact.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_fact(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "random_fact",
    {
      title: "Random fact",
      description: "Get a random interesting fact.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_randomFact(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "daily_fact",
    {
      title: "Fact of the day",
      description: "The UselessFacts fact of the day, with its source and permalink, so a citation still resolves tomorrow.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(await dailyFact()) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
