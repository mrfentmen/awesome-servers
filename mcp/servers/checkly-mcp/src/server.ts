import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { assertContent, assertHeaders, assertStatus, brokenLinks, checkRedirects, checkUrl, errorMessage, assertResponseTime, assertJson, assertRedirect, httpSecurityReport, a11yBasics, seoMeta } from "./api.js"
import { premiumRequired } from "./license.js"
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

  server.registerTool(
    "assert_response_time",
    {
      title: "Assert response time",
      description: "Sample a URL a few times and assert the median and worst time stay inside a budget, reporting each sample.",
      inputSchema: z.object({
        url: z.string().describe("URL to sample, for example https://example.com."),
        budget_ms: z.number().describe("Median time budget in milliseconds. Defaults to 1000.").optional(),
        samples: z.number().describe("Samples to take, 2-5. Defaults to 3.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await assertResponseTime(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "assert_json",
    {
      title: "Assert JSON",
      description: "Treat a URL as a JSON API: check it parses, then assert a dot-path exists and optionally equals or contains a value.",
      inputSchema: z.object({
        url: z.string().describe("JSON endpoint to check, for example https://api.github.com/repos/microsoft/vscode."),
        path: z.string().describe("Dot path to read, e.g. status or data.items.0.name.").optional(),
        equals: z.string().describe("Exact value the path must equal (compared as text).").optional(),
        contains: z.string().describe("Substring the resolved value must contain.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await assertJson(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "assert_redirect",
    {
      title: "Assert redirect",
      description: "Assert that a URL redirects, optionally that it lands on a given Location and answers with a specific status.",
      inputSchema: z.object({
        url: z.string().describe("URL expected to redirect, for example http://example.com."),
        location_contains: z.string().describe("Text the first Location header must contain, e.g. https://example.com.").optional(),
        status: z.string().describe('Redirect status to expect: "301", "3xx" or a list.').optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await assertRedirect(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "http_security_report",
    {
      title: "HTTP security report",
      description: "Transport and browser-side security for one URL: HTTPS upgrade, HSTS, CSP, nosniff, referrer and permissions policy, COOP, Secure and HttpOnly cookie flags, and any plain-HTTP resource referenced by the page.",
      inputSchema: z.object({
        url: z.string().describe("URL or hostname to audit."),
        method: z.string().optional().describe("HTTP method (default GET)."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: http_security_report ----
    const paywallMessage = await premiumRequired("http_security_report")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await httpSecurityReport(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "a11y_basics",
    {
      title: "Accessibility basics",
      description: "The machine-checkable part of an accessibility audit: html lang, document title, single h1 and heading levels, image alt attributes, blank alt text, viewport zoom locking, landmark elements and a skip link.",
      inputSchema: z.object({
        url: z.string().describe("URL or hostname to check."),
        max_images: z.number().int().min(1).max(300).default(50).describe("How many images to audit, default 50"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await a11yBasics(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "seo_meta",
    {
      title: "SEO metadata",
      description: "Search metadata actually served by one URL: title length, meta description, rel=canonical, Open Graph and Twitter card tags, robots meta, hreflang alternates and whether every JSON-LD block parses.",
      inputSchema: z.object({
        url: z.string().describe("URL or hostname to check."),
        min_title: z.number().int().min(1).max(300).default(10).describe("Minimum acceptable title length, default 10"),
        max_title: z.number().int().min(1).max(300).default(70).describe("Maximum acceptable title length, default 70"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: seo_meta ----
    const paywallMessage = await premiumRequired("seo_meta")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await seoMeta(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
