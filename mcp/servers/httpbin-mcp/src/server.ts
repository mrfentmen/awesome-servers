import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { get, headers, ip } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "httpbin-mcp", version: "1.0.0" })
  server.registerTool(
    "get",
    {
      title: "Get",
      description: "Send a GET request and see echo.",
      inputSchema: z.object( { path: z.string().describe("Endpoint path.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await get(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "ip",
    {
      title: "Ip",
      description: "Your outbound IP.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ip(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "headers",
    {
      title: "Headers",
      description: "Request headers echo.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await headers(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "base64_decode",
    {
      title: "Base64 decode",
      description: "Decode base64 through httpbin, surfacing the server's own correction hint when the input is not decodable.",
      inputSchema: z.object( { value: z.string().describe("Base64 text to decode."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement decode locally (paywall removed)
    try { return textError("Not yet implemented: decode") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "echo_anything",
    {
      title: "Echo anything",
      description: "Send a request to httpbin's /anything and get the full request reflected back, which shows exactly what your client put on the wire.",
      inputSchema: z.object( { path: z.string().describe("Optional extra path, e.g. /probe/check.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement anything locally (paywall removed)
    try { return textError("Not yet implemented: anything") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "status_check",
    {
      title: "Status check",
      description: "Ask httpbin for a specific HTTP status code, so a client's handling of errors and redirects can be tested deliberately.",
      inputSchema: z.object( { code: z.number().describe("HTTP status code, 100-599.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement check locally (paywall removed)
    try { return textError("Not yet implemented: check") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
