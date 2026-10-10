import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { openPage } from "./api.js"
import { screenshotPage, pageLinks, pageHeadings, runScript } from "./api.js"
import { premiumRequired } from "./license.js"

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
    // ---- paywall: page_links ----
    const paywallMessage = await premiumRequired("page_links")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
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
    // ---- paywall: run_script ----
    const paywallMessage = await premiumRequired("run_script")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await runScript(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
