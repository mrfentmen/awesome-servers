import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { m0_chains, m0_protocol, m1_chainTvl, m1_protocolInfo, m1_topProtocols } from './api.js'

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'defillama-mcp', version: '1.0.0' })
server.registerTool(
    "chains",
    {
      title: "Chains",
      description: "TVL by chain.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_chains(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "protocol",
    {
      title: "Protocol",
      description: "TVL history for a protocol.",
      inputSchema: z.object( { slug: z.string().describe("Protocol slug.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_protocol(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "top_protocols",
    {
      title: "Top protocols",
      description: "Get the top DeFi protocols by TVL.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_topProtocols(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "chain_tvl",
    {
      title: "Chain tvl",
      description: "Get TVL for all chains.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_chainTvl(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "protocol_info",
    {
      title: "Protocol info",
      description: "Get details for a specific protocol.",
      inputSchema: z.object( { protocol: z.string().describe("Protocol slug.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_protocolInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
