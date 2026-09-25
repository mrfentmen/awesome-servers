import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  checkAccount,
  listBreaches,
  checkPastes,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "hibp-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "check_account",
    {
      title: "Breach check",
      description: "Breaches for an account/email.",
      inputSchema: z.object({
        account: z.string().describe("Email or username.")
      }),
      annotations: READ_ONLY,
    },
    async ({ account }) => {
      try {
        return text(await checkAccount(account));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_breaches",
    {
      title: "Breach catalog",
      description: "All known breaches.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listBreaches());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "check_pastes",
    {
      title: "Paste check",
      description: "Pastes containing an email.",
      inputSchema: z.object({
        email: z.string().describe("Email address.")
      }),
      annotations: READ_ONLY,
    },
    async ({ email }) => {
      try {
        return text(await checkPastes(email));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}