import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { openPage, screenshotPage, pageLinks, pageHeadings, runScript } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "browser-mcp", version: "1.0.0" })
  server.registerTool(
    "open_page",
    {
      title: "Open page",
      description: "Open a URL in headless Chrome and return the title and a text sample.",
      inputSchema: z.object( { url: z.string().describe("Full URL to open.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await openPage(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "screenshot_page",
    {
      title: "Screenshot page",
      description: "Take a screenshot of a URL and save it to a local file.",
      inputSchema: z.object( { url: z.string().describe("Full URL to capture.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await screenshotPage(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "page_links",
    {
      title: "Page links",
      description: "Every absolute link on a page with its anchor text, plus the hosts those links point at.",
      inputSchema: z.object( { url: z.string().describe("Full http or https URL."), limit: z.number().describe("Max links.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pageLinks(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "page_headings",
    {
      title: "Page headings",
      description: "The heading outline of a page, indented by level, with a count per heading level.",
      inputSchema: z.object( { url: z.string().describe("Full http or https URL."), limit: z.number().describe("Max headings.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pageHeadings(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "run_script",
    {
      title: "Run script",
      description: "Run a JavaScript expression in a headless Chrome page and return its result.",
      inputSchema: z.object( { url: z.string().describe("Full http or https URL to load first."), script: z.string().describe("JavaScript expression to evaluate in the page.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await runScript(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "dns_records",
    {
      title: "Public DNS records",
      description: "Resolve a domain through Google DNS over HTTPS and report records, TTLs, DNS response code and authenticated-data status for website troubleshooting.",
      inputSchema: z.object({ domain: z.string().describe("DNS name; defaults to example.com.").optional(), type: z.string().describe("A, AAAA, MX, TXT, NS, CNAME or CAA; defaults to A.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: dns_records ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_browser_dns_records", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
