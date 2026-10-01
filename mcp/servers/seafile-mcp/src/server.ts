import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listLibraries,
  getLibraryInfo,
  getDefaultLibrary,
  getFileDetail,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "seafile-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_libraries",
    {
      title: "List libraries",
      description: "All libraries the token can access.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listLibraries());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_library_info",
    {
      title: "Library info",
      description: "Seafile library metadata.",
      inputSchema: z.object({
        repo_id: z.string().describe("Library (repo) ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ repo_id }) => {
      try {
        return text(await getLibraryInfo(repo_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_default_library",
    {
      title: "Default library",
      description: "The account default library.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getDefaultLibrary());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_file_detail",
    {
      title: "File detail",
      description: "Metadata of a file in a library.",
      inputSchema: z.object({
        repo_id: z.string().describe("Library (repo) ID."),
        path: z.string().describe("File path, e.g. /docs/report.pdf.")
      }),
      annotations: READ_ONLY,
    },
    async ({ repo_id, path }) => {
      try {
        return text(await getFileDetail(repo_id, path));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}