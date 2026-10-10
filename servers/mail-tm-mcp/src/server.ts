import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { domains } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "mail-tm-mcp", version: "1.0.0" })
  server.registerTool(
    "domains",
    {
      title: "Domains",
      description: "List available domains.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await domains(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "inbox",
    {
      title: "Inbox",
      description: "List the messages waiting in a mail.tm inbox. The address and password are the credential; nothing is created or deleted.",
      inputSchema: z.object( { address: z.string().describe("mail.tm address."), password: z.string().describe("mail.tm password."), limit: z.number().describe("Max messages.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: inbox ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_mail_tm_inbox", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "read_message",
    {
      title: "Read message",
      description: "One message from a mail.tm inbox in full, with its body text. Takes the message id from the inbox listing.",
      inputSchema: z.object( { address: z.string().describe("mail.tm address."), password: z.string().describe("mail.tm password."), message_id: z.string().describe("Message id from the inbox listing.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: read_message ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_mail_tm_read_message", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
