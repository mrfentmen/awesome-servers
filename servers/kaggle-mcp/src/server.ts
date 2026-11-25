import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  kernelStatus,
  kernelList,
  kernelLog,
  kernelPush,
  datasetList,
  datasetStatus,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "kaggle-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "kernel_status",
    {
      title: "Kernel status",
      description: "Training run state: QUEUED, RUNNING, COMPLETE, ERROR. Pass owner/slug.",
      inputSchema: z.object({
        id: z.string().describe("Kernel id, e.g. aeeeeeeee/train-vanguard-fix2."),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(await kernelStatus(id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "kernel_list",
    {
      title: "List kernels",
      description: "Your kernels, optional search string.",
      inputSchema: z.object({
        search: z.string().describe("Search filter.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ search }) => {
      try {
        return text(await kernelList(search));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "kernel_log",
    {
      title: "Kernel log tail",
      description: "Downloads the kernel session log and returns the tail — read this on ERROR.",
      inputSchema: z.object({
        id: z.string().describe("Kernel id, e.g. aeeeeeeee/train-vanguard-fix2."),
        tail_lines: z.string().describe("Lines from the end (default 40).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ id, tail_lines }) => {
      try {
        return text(await kernelLog(id, Number(tail_lines ?? 40) || 40));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "kernel_push",
    {
      title: "Push kernel",
      description: "Pushes a local kernel dir (code + metadata) as a new version. Starts training.",
      inputSchema: z.object({
        dir: z.string().describe("Local kernel directory path."),
      }),
    },
    async ({ dir }) => {
      try {
        return text(await kernelPush(dir));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "dataset_list",
    {
      title: "List datasets",
      description: "Search datasets by name.",
      inputSchema: z.object({
        search: z.string().describe("Search filter.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ search }) => {
      try {
        return text(await datasetList(search));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "dataset_status",
    {
      title: "Dataset status",
      description: "Is a dataset version ready? Check after versioning before a kernel starts.",
      inputSchema: z.object({
        ref: z.string().describe("Dataset ref, e.g. aeeeeeeee/vanguard-train."),
      }),
      annotations: READ_ONLY,
    },
    async ({ ref }) => {
      try {
        return text(await datasetStatus(ref));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
