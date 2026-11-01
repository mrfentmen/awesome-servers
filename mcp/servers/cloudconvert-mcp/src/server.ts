import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  CcError,
  cancelJob,
  cancelTask,
  convertFile,
  createJob,
  formatAccount,
  formatFormatList,
  formatJob,
  formatTask,
  getAccount,
  getJob,
  getTask,
  listFormats,
  listJobs,
  listJobTasks,
  waitTask,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof CcError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "cloudconvert-mcp",
    version: "1.0.0",
  })

  server.tool(
    "get_account",
    "Get the CloudConvert account: username, email, remaining credits.",
    {},
    async () => {
      try {
        return text(formatAccount(await getAccount()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_formats",
    "List supported conversion pairs (input format -> output format). " +
      "Filter by input format to keep the result small.",
    {
      input_format: z.string().optional().describe("Only show conversions from this format, e.g. 'pdf'"),
      limit: z.number().int().min(1).max(200).default(40).describe("How many pairs to print"),
    },
    async ({ input_format, limit }) => {
      try {
        return text(formatFormatList(await listFormats(input_format), limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_jobs",
    "List recent CloudConvert jobs, newest first.",
    {
      status: z.string().optional().describe("Filter by status, e.g. 'finished', 'error', 'processing'"),
      per_page: z.number().int().min(1).max(100).default(20).describe("Jobs per page"),
    },
    async ({ status, per_page }) => {
      try {
        const jobs = await listJobs(status, per_page)
        if (jobs.length === 0) return text("No jobs found.")
        return text(jobs.map((j, i) => formatJob(j, i)).join("\n\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_job",
    "Create a job from an array of task objects. Task 1 is usually " +
      "{operation:'import/url', url:'https://...'}, then {operation:'convert', input_format, output_format, input:'import-1'}, " +
      "then {operation:'export/url', input:'convert-1'}.",
    {
      tasks: z.array(z.record(z.unknown())).min(1).describe("Array of CloudConvert task objects"),
      tag: z.string().optional().describe("Optional tag to find the job later"),
      redirect_url: z.string().optional().describe("Optional webhook URL called when the job finishes"),
    },
    async ({ tasks, tag, redirect_url }) => {
      try {
        const job = await createJob({ tasks, tag, redirectUrl: redirect_url })
        return text(formatJob(job))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_job",
    "Get one job by id, including its tasks and their status.",
    { job_id: z.string().describe("CloudConvert job id") },
    async ({ job_id }) => {
      try {
        return text(formatJob(await getJob(job_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "cancel_job",
    "Cancel a running job and all of its unfinished tasks.",
    { job_id: z.string().describe("CloudConvert job id") },
    async ({ job_id }) => {
      try {
        return text(formatJob(await cancelJob(job_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_job_tasks",
    "List the tasks of a job with their status and output files.",
    { job_id: z.string().describe("CloudConvert job id") },
    async ({ job_id }) => {
      try {
        const tasks = await listJobTasks(job_id)
        if (tasks.length === 0) return text(`Job ${job_id} has no tasks.`)
        return text(tasks.map((t) => formatTask(t)).join("\n\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_task",
    "Get one task by id: status, percent done, and output file URLs.",
    { task_id: z.string().describe("CloudConvert task id") },
    async ({ task_id }) => {
      try {
        return text(formatTask(await getTask(task_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "wait_task",
    "Block until a task finishes (or fails) and return its result. " +
      "Use this after creating a job instead of polling.",
    { task_id: z.string().describe("CloudConvert task id") },
    async ({ task_id }) => {
      try {
        return text(formatTask(await waitTask(task_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "cancel_task",
    "Cancel a single task.",
    { task_id: z.string().describe("CloudConvert task id") },
    async ({ task_id }) => {
      try {
        return text(formatTask(await cancelTask(task_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "convert_file",
    "Convert one file with the simple /convert shortcut: give a public " +
      "source URL (or an uploaded file id), the input and output formats.",
    {
      input_format: z.string().describe("Source format, e.g. 'docx'"),
      output_format: z.string().describe("Target format, e.g. 'pdf'"),
      input: z.string().describe("Public URL of the source file, or an existing file/task id"),
      filename: z.string().optional().describe("Filename for the output"),
      options: z.record(z.unknown()).optional().describe("Extra conversion options, passed through as-is"),
    },
    async ({ input_format, output_format, input, filename, options }) => {
      try {
        const job = await convertFile({ inputFormat: input_format, outputFormat: output_format, input, filename, options })
        return text(formatJob(job))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
