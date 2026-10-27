import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { domainToAscii, domainToUnicodeTool, inspectDomain, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "punycode-mcp", version: "1.0.0" })

  server.tool(
    "domain_to_ascii",
    "Convert a Unicode domain to its punycode (ASCII) form.",
    {
      domain: z.string().min(1).describe('Domain such as "münchen.de"')
    },
    async (a) => {
      try {
        return text(await domainToAscii(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "domain_to_unicode",
    "Convert a punycode domain back to Unicode.",
    {
      domain: z.string().min(1).describe('Domain such as "xn--mnchen-3ya.de"')
    },
    async (a) => {
      try {
        return text(await domainToUnicodeTool(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "inspect_domain",
    "Show every label, its ASCII form and whether it needs punycode.",
    {
      domain: z.string().min(1).describe("Domain name to inspect")
    },
    async (a) => {
      try {
        return text(await inspectDomain(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
