import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listProjects,
  listConfigs,
  listSecrets,
  downloadSecrets,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "doppler-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description: "Doppler projects with names and descriptions.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listProjects());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_configs",
    {
      title: "List configs",
      description: "Doppler configs (environments) in a project.",
      inputSchema: z.object({
        project: z.string().describe("Project name or slug"),
      }),
      annotations: READ_ONLY,
    },
    async ({ project }) => {
      try {
        return text(await listConfigs(project));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_secrets",
    {
      title: "List secrets",
      description: "Secrets in a Doppler config with raw and computed values plus visibility.",
      inputSchema: z.object({
        project: z.string().describe("Project"),
        config: z.string().describe("Config, e.g. 'dev'"),
        secrets: z.string().optional().describe("Comma-separated names to include"),
      }),
      annotations: READ_ONLY,
    },
    async ({ project, config, secrets }) => {
      try {
        return text(await listSecrets(project, config, secrets));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "download_secrets",
    {
      title: "Download secrets",
      description: "Doppler config secrets as JSON, env file, or dotenv for local use.",
      inputSchema: z.object({
        project: z.string().describe("Project"),
        config: z.string().describe("Config"),
        format: z.string().default("json").describe("json, env or dotenv"),
      }),
      annotations: READ_ONLY,
    },
    async ({ project, config, format }) => {
      try {
        return text(await downloadSecrets(project, config, format));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
