import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatPin, listPins, pinJson, PinataError, unpin, decodeCidTool, compareCids, convertCid } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const
const DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "pinata-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_pins",
    {
      title: "List pins",
      description: "Pinned IPFS files: CIDs, names, sizes, dates.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const { count, pins } = await listPins(limit)
        if (pins.length === 0) return text("No pins.")
        return text(`${count} pins total:\n\n${pins.map((p, i) => formatPin(p, i)).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "pin_json",
    {
      title: "Pin JSON",
      description: "Pin a JSON document to IPFS. Returns the CID and gateway link.",
      inputSchema: z.object({
        name: z.string().describe("Pin name, e.g. my-file"),
        content: z.string().describe("Valid JSON document as text"),
      }),
      annotations: WRITE,
    },
    async ({ name, content }) => {
      try {
        return text(await pinJson(name, content))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "unpin",
    {
      title: "Unpin CID",
      description: "Remove a pin by CID. Cannot be undone.",
      inputSchema: z.object({
        cid: z.string().describe("IPFS CID, e.g. 'Qm...'"),
      }),
      annotations: DESTRUCTIVE,
    },
    async ({ cid }) => {
      try {
        return text(await unpin(cid))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "decode_cid",
    {
      title: "Decode a CID",
      description:
        "Decode a content identifier into its version, multibase, multicodec, multihash function and digest, entirely locally.",
      inputSchema: z.object({
        cid: z.string().describe("CIDv0 (Qm...) or CIDv1 (bafy.../bafk.../bagb...)"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: decode_cid ----
    const paywallMessage = await premiumRequired("decode_cid")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await decodeCidTool(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "compare_cids",
    {
      title: "Compare CIDs",
      description:
        "Decode a list of CIDs, report malformed entries, exact duplicates, and which entries name the same content in more than one form.",
      inputSchema: z.object({
        cids: z.array(z.string()).describe("Up to 25 CIDs to check, e.g. ['QmT5Nv...', 'bafybei...']"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: compare_cids ----
    const paywallMessage = await premiumRequired("compare_cids")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await compareCids(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "convert_cid",
    {
      title: "Re-encode a CID",
      description:
        "Re-encode a CID as CIDv0/base58 or CIDv1/base32 with its multihash bytes unchanged, and read the result back to confirm it.",
      inputSchema: z.object({
        cid: z.string().describe("CIDv0 (Qm...) or CIDv1 (bafy...)"),
        to: z.enum(["v0", "v1", "base58", "base32"]).describe("Form to produce."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await convertCid(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof PinataError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
