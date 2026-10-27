import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  me,
  getFile,
  projectFiles,
  teamProjects,
  fileComments,
  fileVersions,
  fileComponents,
  fileStyles,
  fileNodes,
  fileImages,
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
      description: "The Figma user the access token belongs to.",
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
      description: "File metadata: name, pages and last modified date.",
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
      description: "Figma files inside one project id.",
      inputSchema: z.object({
        project_id: z.string().describe("Project ID from the Figma URL")
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

  server.registerTool(
    "team_projects",
    {
      title: "Team projects",
      description: "Projects in a team.",
      inputSchema: z.object({
        team_id: z.string().describe("Team ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ team_id }) => {
      try {
        return text(await teamProjects(team_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "file_comments",
    {
      title: "File comments",
      description: "Comments on a file.",
      inputSchema: z.object({
        file_key: z.string().describe("File key.")
      }),
      annotations: READ_ONLY,
    },
    async ({ file_key }) => {
      try {
        return text(await fileComments(file_key));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "file_versions",
    {
      title: "File versions",
      description: "Version history.",
      inputSchema: z.object({
        file_key: z.string().describe("File key.")
      }),
      annotations: READ_ONLY,
    },
    async ({ file_key }) => {
      try {
        return text(await fileVersions(file_key));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "file_components",
    {
      title: "Components",
      description: "Published components.",
      inputSchema: z.object({
        file_key: z.string().describe("File key.")
      }),
      annotations: READ_ONLY,
    },
    async ({ file_key }) => {
      try {
        return text(await fileComponents(file_key));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "file_styles",
    {
      title: "Styles",
      description: "Published styles.",
      inputSchema: z.object({
        file_key: z.string().describe("File key.")
      }),
      annotations: READ_ONLY,
    },
    async ({ file_key }) => {
      try {
        return text(await fileStyles(file_key));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "file_nodes",
    {
      title: "File nodes",
      description: "Nodes by IDs.",
      inputSchema: z.object({
        file_key: z.string().describe("File key."),
        node_ids: z.string().describe("Comma-separated node IDs.")
      }),
      annotations: READ_ONLY,
    },
    async ({ file_key, node_ids }) => {
      try {
        return text(await fileNodes(file_key, node_ids));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "file_images",
    {
      title: "Render nodes",
      description: "PNG renders.",
      inputSchema: z.object({
        file_key: z.string().describe("File key."),
        node_ids: z.string().describe("Comma-separated node IDs.")
      }),
      annotations: READ_ONLY,
    },
    async ({ file_key, node_ids }) => {
      try {
        return text(await fileImages(file_key, node_ids));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}