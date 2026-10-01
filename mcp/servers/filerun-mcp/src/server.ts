import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  browseFolder,
  searchFiles,
  createFolder,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "filerun-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "browse_folder",
    {
      title: "Browse folder",
      description: "List files and folders in a FileRun path (requires FILERUN_ACCESS_TOKEN).",
      inputSchema: z.object({
        path: z.string().describe("FileRun folder path.")
      }),
      annotations: READ_ONLY,
    },
    async ({ path }) => {
      try {
        return text(await browseFolder(path));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_files",
    {
      title: "Search files",
      description: "Search file/folder names or contents under a path.",
      inputSchema: z.object({
        path: z.string().describe("FileRun folder path to search in."),
        filename: z.string().describe("Keyword for file/folder names.").optional(),
        contents: z.string().describe("Keyword for file contents (no other criteria).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ path, filename, contents }) => {
      try {
        return text(await searchFiles(path, filename, contents));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "create_folder",
    {
      title: "Create folder",
      description: "Create a folder (requires upload scope).",
      inputSchema: z.object({
        path: z.string().describe("Parent folder path."),
        name: z.string().describe("New folder name.")
      }),
      annotations: MUTATING,
    },
    async ({ path, name }) => {
      try {
        return text(await createFolder(path, name));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}