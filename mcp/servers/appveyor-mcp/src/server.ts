import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { ciStats, errorMessage, githubJobs, githubWorkflowRuns, latestCiStatus, pipelineDetail, pipelineJobs, projectPipelines, projectReleases, repoLanguages } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "appveyor-mcp",
    version: "2.0.0",
  })

  server.registerTool(
    "project_pipelines",
    {
      title: "List CI pipelines",
      description: "List the most recent GitLab CI pipelines for a project, newest first, with status, branch, trigger, age and duration. No API key needed.",
      inputSchema: z.object({
        project: z.string().describe("Project path such as gitlab-org/cli, or a numeric project id."),
        ref: z.string().describe("Only show pipelines for this branch or tag.").optional(),
        limit: z.number().describe("How many pipelines to list, 1 to 50. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ project, ref, limit }) => {
      try {
        return text(await projectPipelines({ project, ref, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "pipeline_detail",
    {
      title: "Pipeline details",
      description: "Fetch one CI pipeline by id: status, branch, commit, trigger source, timings and URL.",
      inputSchema: z.object({
        project: z.string().describe("Project path such as gitlab-org/cli, or a numeric project id."),
        pipelineId: z.number().describe("Numeric pipeline id."),
      }),
      annotations: READ_ONLY,
    },
    async ({ project, pipelineId }) => {
      try {
        return text(await pipelineDetail({ project, pipelineId }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "pipeline_jobs",
    {
      title: "Pipeline jobs by stage",
      description: "Show every job in a pipeline grouped by stage, with status, duration and the failure reason, plus the first job you should look at when a build is red.",
      inputSchema: z.object({
        project: z.string().describe("Project path such as gitlab-org/cli, or a numeric project id."),
        pipelineId: z.number().describe("Numeric pipeline id."),
        limit: z.number().describe("How many jobs to fetch, 1 to 100. Defaults to 30.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ project, pipelineId, limit }) => {
      try {
        return text(await pipelineJobs({ project, pipelineId, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "ci_stats",
    {
      title: "CI success statistics",
      description: "Measure a project's pipeline health over its recent runs: success rate, average duration, the flakiest branches and a plain verdict.",
      inputSchema: z.object({
        project: z.string().describe("Project path such as gitlab-org/cli, or a numeric project id."),
        limit: z.number().describe("How many recent pipelines to analyse, 5 to 100. Defaults to 50.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ project, limit }) => {
      try {
        return text(await ciStats({ project, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "latest_ci_status",
    {
      title: "Latest status for many projects",
      description: "Check the newest pipeline of up to 10 projects at once and report a compact green or red build board with age and duration.",
      inputSchema: z.object({
        projects: z.array(z.string()).describe("Project paths, maximum 10, for example [\"gitlab-org/cli\"]."),
      }),
      annotations: READ_ONLY,
    },
    async ({ projects }) => {
      try {
        return text(await latestCiStatus({ projects }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "github_workflow_runs",
    {
      title: "GitHub Actions runs",
      description: "List recent GitHub Actions workflow runs for a public repository with conclusion, branch, trigger event and attempt number.",
      inputSchema: z.object({
        repo: z.string().describe("Repository as owner/repo, for example actions/runner."),
        branch: z.string().describe("Only show runs for this branch.").optional(),
        limit: z.number().describe("How many runs to list, 1 to 50. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ repo, branch, limit }) => {
      try {
        return text(await githubWorkflowRuns({ repo, branch, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "github_jobs",
    {
      title: "GitHub Actions jobs and failed steps",
      description: "Show the jobs of a GitHub Actions run and name the exact step that failed, so you can go straight to the cause.",
      inputSchema: z.object({
        repo: z.string().describe("Repository as owner/repo, for example actions/runner."),
        runId: z.number().describe("The numeric workflow run id."),
      }),
      annotations: READ_ONLY,
    },
    async ({ repo, runId }) => {
      try {
        return text(await githubJobs({ repo, runId }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "project_releases",
    {
      title: "Project releases and changelog",
      description: "List a GitLab project's published releases newest first, with tag, release date, author, commit, the headline of the changelog and how many source archives and binary links ship with it.",
      inputSchema: z.object({
        project: z.string().describe("Project path such as gitlab-org/cli, or a numeric project id."),
        limit: z.number().describe("How many releases to list, 1 to 30. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ project, limit }) => {
      try {
        return text(await projectReleases({ project, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "repo_languages",
    {
      title: "Repository language breakdown",
      description: "Show which languages a public GitHub repository is written in, with the size and share of each, so you can see the stack a project is built on before reading any of its code.",
      inputSchema: z.object({
        repo: z.string().describe("Repository as owner/repo, for example actions/runner."),
      }),
      annotations: READ_ONLY,
    },
    async ({ repo }) => {
      try {
        return text(await repoLanguages({ repo }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
