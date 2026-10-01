import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, listTorrents, getTransferInfo, getAppVersion, parseMagnet, torrentGeometry } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "qbittorrent-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_torrents",
    {
      title: "List torrents",
      description: "All torrents with progress, size and state.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listTorrents());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_transfer_info",
    {
      title: "Transfer stats",
      description: "Global upload and download speeds.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getTransferInfo());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_app_version",
    {
      title: "App version",
      description: "qBittorrent version and API version.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getAppVersion());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "parse_magnet",
    {
      title: "Parse a magnet link",
      description:
        "Read a magnet URI or a bare info hash: the v1 hash in both 40-character hex and 32-character base32, any v2 multihash topic, the suggested name, the claimed length and every tracker.",
      inputSchema: z.object({
        uri: z.string().describe("A magnet: URI, or a bare 32-character base32 v0 info hash"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: parse_magnet ----
    const paywallMessage = await premiumRequired("parse_magnet")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await parseMagnet(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "torrent_geometry",
    {
      title: "Torrent geometry",
      description:
        "The piece arithmetic for a payload at a given piece length: piece count, the size of the final piece, the 16 KiB padding a .torrent needs and the resulting hash-list overhead.",
      inputSchema: z.object({
        size_bytes: z.number().describe("Total payload size in bytes, e.g. 4294967296 for 4 GiB"),
        piece_kb: z.number().describe("Piece length in KiB: 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192 or 16384.").optional(),
        piece_size: z.number().describe("Piece length in bytes instead, a multiple of 16384. Overrides piece_kb.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: torrent_geometry ----
    const paywallMessage = await premiumRequired("torrent_geometry")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await torrentGeometry(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}