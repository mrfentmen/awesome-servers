import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { domainReport, fileReport, formatVerdict, ipReport, urlReport, VirusTotalError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "virustotal-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "file_report",
    {
      title: "File report",
      description: "Engine verdicts for a file hash (MD5/SHA1/SHA256).",
      inputSchema: z.object({
        hash: z.string().describe("File hash"),
      }),
      annotations: READ_ONLY,
    },
    async ({ hash }) => {
      try {
        return text(formatVerdict(await fileReport(hash)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "url_report",
    {
      title: "URL report",
      description: "Engine verdicts for a URL.",
      inputSchema: z.object({
        url: z.string().describe("Full URL with https://"),
      }),
      annotations: READ_ONLY,
    },
    async ({ url }) => {
      try {
        return text(formatVerdict(await urlReport(url)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "domain_report",
    {
      title: "Domain report",
      description: "Engine verdicts and reputation for a domain.",
      inputSchema: z.object({
        domain: z.string().describe("Domain, e.g. 'example.com'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ domain }) => {
      try {
        return text(formatVerdict(await domainReport(domain)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "ip_report",
    {
      title: "IP report",
      description: "Engine verdicts and reputation for an IP address.",
      inputSchema: z.object({
        ip: z.string().describe("IPv4 or IPv6 address"),
      }),
      annotations: READ_ONLY,
    },
    async ({ ip }) => {
      try {
        return text(formatVerdict(await ipReport(ip)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof VirusTotalError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
