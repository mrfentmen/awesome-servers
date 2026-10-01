import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listDatasets,
  listVersions,
  listFiles,
  getFile,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "knmi-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_datasets",
    {
      title: "List datasets",
      description: "KNMI open datasets: weather stations, radar, climate series, forecasts.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listDatasets());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_versions",
    {
      title: "List dataset versions",
      description: "Available versions of a KNMI dataset.",
      inputSchema: z.object({
        dataset: z.string().describe("Dataset name, e.g. 'Actuele10mindataKNMIstations'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ dataset }) => {
      try {
        return text(await listVersions(dataset));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_files",
    {
      title: "List dataset files",
      description: "Files in a KNMI dataset version with sizes and download links.",
      inputSchema: z.object({
        dataset: z.string().describe("Dataset name"),
        version: z.string().describe("Version, e.g. '1'"),
        maxKeys: z.number().default(20).describe("How many files"),
      }),
      annotations: READ_ONLY,
    },
    async ({ dataset, version, maxKeys }) => {
      try {
        return text(await listFiles(dataset, version, maxKeys));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_file",
    {
      title: "Download dataset file",
      description: "Download one KNMI dataset file (CSV/BUFR/NetCDF metadata) as text, truncated.",
      inputSchema: z.object({
        dataset: z.string().describe("Dataset name"),
        version: z.string().describe("Version"),
        filename: z.string().describe("File name from list_files"),
      }),
      annotations: READ_ONLY,
    },
    async ({ dataset, version, filename }) => {
      try {
        return text(await getFile(dataset, version, filename));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
