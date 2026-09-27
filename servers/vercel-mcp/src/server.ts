import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listProjects,
  getProject,
  listDeployments,
  deploymentDetails,
  listAliases,
  listDomains,
  domainInfo,
  listTeams,
  projectEnv,
  getAlias,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "vercel-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description: "Vercel projects in the account, most recent first.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listProjects(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_project",
    {
      title: "Get project",
      description: "Details for one project, by id or name.",
      inputSchema: z.object({
        project_id: z.string().describe("Project ID or name.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await getProject(project_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_deployments",
    {
      title: "List deployments",
      description: "Deployments, optionally per project.",
      inputSchema: z.object({
        project_id: z.string().describe("Filter by project.").optional(),
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id, limit }) => {
      try {
        return text(await listDeployments(project_id, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "deployment_details",
    {
      title: "Deployment details",
      description: "Single deployment.",
      inputSchema: z.object({
        deploy_id: z.string().describe("Deployment ID or URL.")
      }),
      annotations: READ_ONLY,
    },
    async ({ deploy_id }) => {
      try {
        return text(await deploymentDetails(deploy_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_aliases",
    {
      title: "List aliases",
      description: "Domain aliases.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listAliases(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_domains",
    {
      title: "List domains",
      description: "Custom domains.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listDomains());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "domain_info",
    {
      title: "Domain info",
      description: "Domain details.",
      inputSchema: z.object({
        domain: z.string().describe("Domain name.")
      }),
      annotations: READ_ONLY,
    },
    async ({ domain }) => {
      try {
        return text(await domainInfo(domain));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_teams",
    {
      title: "List teams",
      description: "Teams.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listTeams());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "project_env",
    {
      title: "Project env",
      description: "Env var names.",
      inputSchema: z.object({
        project_id: z.string().describe("Project ID or name.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await projectEnv(project_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_alias",
    {
      title: "Get alias",
      description: "Alias details by hostname.",
      inputSchema: z.object({
        alias: z.string().describe("Alias hostname.")
      }),
      annotations: READ_ONLY,
    },
    async ({ alias }) => {
      try {
        return text(await getAlias(alias));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}