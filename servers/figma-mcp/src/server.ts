import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  me,
  getFile,
  projectFiles,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "figma-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "me",
    {
      title: "My profile",
      description: "Figma user.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await me());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_file",
    {
      title: "Get file",
      description: "File metadata.",
      inputSchema: z.object({
        file_key: z.string().describe("File key from URL.")
      }),
      annotations: READ_ONLY,
    },
    async ({ file_key }) => {
      try {
        return text(await getFile(file_key));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "project_files",
    {
      title: "Project files",
      description: "Files in a project.",
      inputSchema: z.object({
        project_id: z.string().describe("Project ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await projectFiles(project_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}