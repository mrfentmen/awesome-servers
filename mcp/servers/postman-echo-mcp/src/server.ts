import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { get, ip } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "postman-echo-mcp", version: "1.0.0" })
  server.registerTool(
    "get",
    {
      title: "Get",
      description: "Echo a GET request.",
      inputSchema: z.object( { params: z.string().describe("Query params as a=b&c=d.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await get(args)) } catch (e) { return textError(error(e)) }
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
    try { return text(await ip(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "status_probe",
    {
      title: "Status probe",
      description: "Ask Postman Echo for a specific HTTP status code and report what actually came back: status, body and headers.",
      inputSchema: z.object({ code: z.number().describe("HTTP status code to request, 100-599, for example 418."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: status_probe ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_postman_echo_status_probe", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "header_echo",
    {
      title: "Header echo",
      description: "Send custom request headers through Postman Echo and report whether each one came back unchanged in the response body.",
      inputSchema: z.object({ headers: z.string().describe("Headers as name=value pairs joined by &, for example x-trace=abc&x-run=42."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: header_echo ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_postman_echo_header_echo", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "redirect_probe",
    {
      title: "Redirect probe",
      description: "Ask Postman Echo to redirect and report the status code and Location header it returns, without following the redirect.",
      inputSchema: z.object({ url: z.string().describe("Full URL to redirect to, for example https://example.com."), status_code: z.number().describe("3xx code to ask for, 300-399, default 302.").optional(), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: redirect_probe ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_postman_echo_redirect_probe", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "json_body_echo",
    {
      title: "JSON body echo",
      description: "POST a JSON object to Postman Echo and inspect the returned body fields to test JSON request serialization.",
      inputSchema: z.object({ body: z.string().max(4000).describe("JSON object encoded as a string. Defaults to a greeting.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: json_body_echo ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_postman_echo_json_body_echo", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
