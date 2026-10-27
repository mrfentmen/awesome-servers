import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  me,
  listProjects,
  listGroups,
  searchPublic,
  listIssues,
  listMergeRequests,
  projectDetails,
  projectPipelines,
  groupProjects,
  renderMarkdown,
  publicSnippets,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "gitlab-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "me",
    {
      title: "My profile",
      description: "The GitLab user the token belongs to.",
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
    "list_projects",
    {
      title: "List projects",
      description: "Projects the token can see, most recent first.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 100).").optional()
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
    "list_groups",
    {
      title: "List groups",
      description: "Groups the token can see, with path and id.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listGroups(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_public",
    {
      title: "Search public",
      description: "Public projects by query (no token needed).",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchPublic(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_issues",
    {
      title: "All issues",
      description: "Assigned/open issues.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listIssues());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_merge_requests",
    {
      title: "All MRs",
      description: "Open merge requests.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listMergeRequests());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "project_details",
    {
      title: "Project details",
      description: "Single project.",
      inputSchema: z.object({
        project_id: z.string().describe("ID or URL-encoded path.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await projectDetails(project_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "project_pipelines",
    {
      title: "Pipelines",
      description: "Recent pipelines.",
      inputSchema: z.object({
        project_id: z.string().describe("ID or URL-encoded path.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await projectPipelines(project_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "group_projects",
    {
      title: "Group projects",
      description: "Projects in a group.",
      inputSchema: z.object({
        group_id: z.string().describe("Group ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ group_id }) => {
      try {
        return text(await groupProjects(group_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "render_markdown",
    {
      title: "Render markdown",
      description: "GitLab-flavored HTML.",
      inputSchema: z.object({
        markdown: z.string().describe("Markdown text.")
      }),
      annotations: READ_ONLY,
    },
    async ({ markdown }) => {
      try {
        return text(await renderMarkdown(markdown));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "public_snippets",
    {
      title: "Public snippets",
      description: "Discover snippets.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await publicSnippets());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}