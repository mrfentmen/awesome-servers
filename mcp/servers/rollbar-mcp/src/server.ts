import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, listProjects, listItems, getItem } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "rollbar-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description: "Rollbar projects the token can read.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listProjects());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "list_items",
    {
      title: "List items",
      description: "Error items in one project, most recent first.",
      inputSchema: z.object({
        project_id: z.string().describe("Rollbar project ID, e.g. 123456")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await listItems(project_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_item",
    {
      title: "Get item",
      description: "One error item by id, with occurrences and stack.",
      inputSchema: z.object({
        project_id: z.string().describe("Rollbar project ID, e.g. 123456"),
        item_id: z.string().describe("Rollbar item ID, e.g. 1234567890")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id, item_id }) => {
      try {
        return text(await getItem(project_id, item_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "dependency_audit",
    {
      title: "Dependency audit",
      description:
        "Whether a package version falls inside a known advisory's affected range, reading the range events rather than guessing, with each CVE alias, its severity and the version that fixes it.",
      inputSchema: z.object({
        package: z.string().describe("Package name, e.g. 'lodash'"),
        ecosystem: z.string().describe("One of npm, PyPI, Go, Maven, NuGet, RubyGems, crates.io, Packagist, Hex, Pub, Android, Linux, Debian, Alpine"),
        version: z.string().describe("Installed version, so the range can be checked against it.").optional(),
        limit: z.number().describe("Max advisories, 1-25. Defaults to 8.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement audit locally (paywall removed)
    try { return textError("Not yet implemented: audit") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "advisory_detail",
    {
      title: "Advisory detail",
      description:
        "One advisory in full: its description, severity vector, every package and version range it covers, whether it has been withdrawn, and the references to read about it.",
      inputSchema: z.object({
        id: z.string().describe("OSV, GHSA or CVE identifier, e.g. 'GHSA-29mw-wpgm-hmr9'"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}