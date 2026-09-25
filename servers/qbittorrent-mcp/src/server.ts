import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listTorrents,
  getTransferInfo,
  getAppVersion,
} from "./api.js"

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
      description: "All torrents with progress.",
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
      description: "Global up/down speeds.",
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
      description: "qBittorrent version.",
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

  return server
}