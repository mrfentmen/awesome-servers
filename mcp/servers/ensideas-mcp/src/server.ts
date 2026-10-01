import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { resolve, ensMetadata } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ensideas-mcp", version: "1.0.0" })
  server.registerTool(
    "resolve",
    {
      title: "Resolve",
      description: "Resolve an ENS name to an address.",
      inputSchema: z.object( { name: z.string().describe("ENS name like vitalik.eth.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await resolve(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "address_profile",
    {
      title: "Address profile",
      description: "The on chain account behind an ENS name or a 0x address: whether it is a contract, whether its source is verified, its exact balance in wei and ETH, its creator and creation transaction, its proxy type and implementations, and its reverse ENS name. The resolve tool only says which address a name points at, never anything about that address.",
      inputSchema: z.object( { name: z.string().describe("ENS name like vitalik.eth. Omit if you give an address.").optional(), address: z.string().describe("0x address of forty hex characters. Omit if you give a name.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: address_profile ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ensideas_address_profile", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "ens_metadata",
    {
      title: "ENS metadata",
      description: "The full ENS record for a name from the metadata service: the content hash, the resolver contract, the avatar at three sizes, the header image, the description, every chain the name publishes a wallet for and every other text record such as url, twitter, github and email. The resolve tool reads four fields and cannot see any of the rest.",
      inputSchema: z.object( { name: z.string().describe("ENS name like vitalik.eth.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ensMetadata(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
