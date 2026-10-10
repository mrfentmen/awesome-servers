import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { avatar, robohashVariants, robohashCompare } from './api.js'
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'robohash-mcp', version: '1.0.0' })
  server.registerTool(
    'avatar',
    {
      title: "Avatar",
      description: 'RoboHash robot avatar URL.',
      inputSchema: z.object( { text: z.string().describe('Seed text.').optional(), size: z.number().describe('Pixels, default 300.').optional(), set: z.number().describe('Robot set 1-5.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await avatar(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'robohash_variants',
    {
      title: "RoboHash variants",
      description: "Fetch every documented RoboHash parameter variant for one seed - five image formats, five robot sets, two background sets - and report status, content type, size and whether each is actually distinct.",
      inputSchema: z.object( { text: z.string().describe('Seed text.').optional(), size: z.number().int().min(32).max(1024).default(200) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: robohash_variants ----
    const paywallMessage = await premiumRequired("robohash_variants")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await robohashVariants(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    'robohash_compare',
    {
      title: "RoboHash compare",
      description: "Check that a RoboHash seed is deterministic by requesting it twice, then compare other seeds byte for byte to find which ones render the same robot.",
      inputSchema: z.object( { text: z.string().describe('Reference seed.').optional(), otherSeeds: z.array(z.string()).max(6).describe('Seeds to compare against the reference.').optional(), size: z.number().int().min(32).max(1024).default(200), set: z.number().int().min(1).max(5).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await robohashCompare(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
