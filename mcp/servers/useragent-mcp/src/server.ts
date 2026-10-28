import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { detectBot, parseUserAgent, parseUserAgentBatch, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "useragent-mcp", version: "1.0.0" })

  server.tool(
    "parse_user_agent",
    "Break a user-agent string into browser, version, engine, OS, device type and bot status.",
    {
      userAgent: z.string().min(8).max(1000).describe("User-Agent header value")
    },
    async (a) => {
      try {
        return text(await parseUserAgent(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "detect_bot",
    "Identify search engine crawlers, social previewers and automation clients.",
    {
      userAgent: z.string().min(3).max(1000).describe("User-Agent header value")
    },
    async (a) => {
      try {
        return text(await detectBot(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "parse_user_agent_batch",
    "Parse up to 50 user-agent strings at once.",
    {
      userAgents: z.array(z.string()).min(1).max(50).describe("User-Agent strings")
    },
    async (a) => {
      try {
        return text(await parseUserAgentBatch(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
