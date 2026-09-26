import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  assertContent,
  assertHeaders,
  assertStatus,
  brokenLinks,
  checkRedirects,
  checkUrl,
  errorMessage,
} from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({ name: "checkly-mcp", version: "1.0.0" })

  server.registerTool(
    "assert_status",
    {
      title: "Assert status",
      description: "Run a synthetic check on a URL: does it answer with the status you expect, inside the time budget, without a redirect loop.",
      inputSchema: z.object({
        url: z.string().describe("URL to check, for example https://example.com."),
        expected: z.string().describe('Status to expect: "200", "2xx", "200-204" or a comma-separated list.'),
        method: z.string().describe("HTTP method: GET, HEAD, POST, PUT, DELETE or OPTIONS. Defaults to GET.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await assertStatus(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "assert_headers",
    {
      title: "Assert headers",
      description: "Check that required headers are present, forbidden ones are absent, or one header contains a given value.",
      inputSchema: z.object({
        url: z.string().describe("URL to check, for example https://example.com."),
        required: z.array(z.string()).describe("Header names that must be present, for example ['strict-transport-security'].").optional(),
        forbidden: z.array(z.string()).describe("Header names that must NOT be present, for example ['x-powered-by'].").optional(),
        header: z.string().describe("A single header to inspect, for example content-type.").optional(),
        contains: z.string().describe("Text that header must contain, used together with header.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await assertHeaders(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "assert_content",
    {
      title: "Assert content",
      description: "Check that a page's HTML contains expected text and does not contain forbidden text — a smoke test for deploys.",
      inputSchema: z.object({
        url: z.string().describe("URL to check, for example https://example.com."),
        contains: z.array(z.string()).describe("Strings that must appear in the HTML, for example ['Sign in'].").optional(),
        notContains: z.array(z.string()).describe("Strings that must not appear in the HTML, for example ['Stack trace'].").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await assertContent(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "check_url",
    {
      title: "Check URL",
      description: "Plain reachability check: HTTP status, response time, server header and any redirects.",
      inputSchema: z.object({
        url: z.string().describe("URL or hostname, for example https://example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await checkUrl(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "check_redirects",
    {
      title: "Check redirects",
      description: "Trace every redirect hop with its timing, and flag loops or an http-to-https upgrade that never happens.",
      inputSchema: z.object({
        url: z.string().describe("URL to trace, for example http://example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await checkRedirects(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "broken_links",
    {
      title: "Broken links",
      description: "Read the links on a page and report which ones answer with an error status, so a deploy cannot ship dead links.",
      inputSchema: z.object({
        url: z.string().describe("Page whose links should be checked, for example https://example.com."),
        limit: z.number().describe("How many links to check, 1-40. Defaults to 15.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await brokenLinks(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}
