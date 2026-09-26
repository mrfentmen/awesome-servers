import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  contentCheck,
  endpointSummary,
  errorMessage,
  headersReport,
  latencyBreakdown,
  redirectChain,
  responseTimes,
} from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({ name: "betterstack-mcp", version: "1.0.0" })

  server.registerTool(
    "response_times",
    {
      title: "Response times",
      description: "Sample a URL several times and report min, median, average, max and jitter, so you can tell steady from flaky.",
      inputSchema: z.object({
        url: z.string().describe("URL to sample, for example https://example.com."),
        samples: z.number().describe("Requests to make, 2-10. Defaults to 3.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await responseTimes(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "latency_breakdown",
    {
      title: "Latency breakdown",
      description: "Split one request into DNS, TCP connect, TLS handshake and time-to-headers, and say which stage is slowest.",
      inputSchema: z.object({
        url: z.string().describe("URL to measure, for example https://example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await latencyBreakdown(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "content_check",
    {
      title: "Content check",
      description: "Audit a page's title, meta description, canonical, lang, viewport, headings, image alt text and word count.",
      inputSchema: z.object({
        url: z.string().describe("Page to inspect, for example https://example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await contentCheck(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "redirect_chain",
    {
      title: "Redirect chain",
      description: "Every hop from the URL you give to the URL that finally answers, with timing and loop detection.",
      inputSchema: z.object({
        url: z.string().describe("URL to trace, for example http://example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await redirectChain(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "headers_report",
    {
      title: "Header report",
      description: "Grouped response headers — origin, caching and CDN, compression, security and cookies — with what looks wrong.",
      inputSchema: z.object({
        url: z.string().describe("URL to read the headers from, for example https://example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await headersReport(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "endpoint_summary",
    {
      title: "Endpoint summary",
      description: "One call for a whole endpoint: reachable or not, latency stages, TLS certificate age and DNS address.",
      inputSchema: z.object({
        url: z.string().describe("Endpoint to summarise, for example https://example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await endpointSummary(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}
