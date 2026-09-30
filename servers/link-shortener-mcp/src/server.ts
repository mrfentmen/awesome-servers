import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { expand, shorten, pageExtract, redirectChain } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "link-shortener-mcp", version: "1.0.0" })
  server.registerTool(
    "shorten",
    {
      title: "Shorten",
      description: "Shorten a URL.",
      inputSchema: z.object( { url: z.string().describe("The URL to shorten.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await shorten(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "expand",
    {
      title: "Expand",
      description: "Expand a short URL.",
      inputSchema: z.object( { url: z.string().describe("The short URL.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await expand(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "link_preview",
    {
      title: "Link preview",
      description: "Title, description, publisher and social image for any URL, read live via the microlink API.",
      inputSchema: z.object( { url: z.string().describe("The URL to preview.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: link_preview ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_link_shortener_link_preview", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "link_screenshot",
    {
      title: "Link screenshot",
      description: "Hosted PNG screenshot of any web page, returned as an image URL from the microlink API.",
      inputSchema: z.object( { url: z.string().describe("The URL to capture."), width: z.number().describe("Viewport width in pixels.").optional(), height: z.number().describe("Viewport height in pixels.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: link_screenshot ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_link_shortener_link_screenshot", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "page_extract",
    {
      title: "Extract from page",
      description: "Text or attribute values of one CSS selector on a page (h1 headings, link hrefs, prices) via the microlink API.",
      inputSchema: z.object( { url: z.string().describe("The page to read."), selector: z.string().describe("CSS selector, e.g. h1 or meta[name=description]."), attribute: z.string().describe("HTML attribute to read instead of text, e.g. href or src.").optional(), all: z.boolean().describe("Return every match, not just the first.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pageExtract(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "redirect_chain",
    {
      title: "Redirect chain",
      description: "Every redirect hop of a URL with its status code, ending at the final destination.",
      inputSchema: z.object( { url: z.string().describe("The URL to trace."), maxHops: z.number().describe("Stop after this many hops.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await redirectChain(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
