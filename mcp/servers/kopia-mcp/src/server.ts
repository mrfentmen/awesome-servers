import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listSources,
  listSnapshots,
  getRepoStatus,
  getCurrentUser,
  getTasksSummary,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "kopia-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_sources",
    {
      title: "List sources",
      description: "Snapshot sources on the Kopia server.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listSources());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_snapshots",
    {
      title: "List snapshots",
      description: "Snapshots on the Kopia server.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listSnapshots());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_repo_status",
    {
      title: "Repo status",
      description: "Repository connection status.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getRepoStatus());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_current_user",
    {
      title: "Current user",
      description: "Authenticated Kopia server user.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getCurrentUser());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_tasks_summary",
    {
      title: "Tasks summary",
      description: "Background task summary.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getTasksSummary());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}