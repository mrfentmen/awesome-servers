import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listRuntimes,
  listRuntimeSpecs,
  createRuntime,
  executeCode,
  createSession,
  getSubscription,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({ name: "colab-mcp", version: "1.0.0" })

  server.registerTool(
    "subscription",
    { title: "Plan", description: "Your Colab tier (free/Pro).", inputSchema: z.object({}), annotations: READ_ONLY },
    async () => {
      try {
        return text(await getSubscription())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_runtimes",
    { title: "Runtimes", description: "Your active Colab runtimes.", inputSchema: z.object({}), annotations: READ_ONLY },
    async () => {
      try {
        return text(await listRuntimes())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_runtime_specs",
    { title: "Specs", description: "GPU specs you are eligible for.", inputSchema: z.object({}), annotations: READ_ONLY },
    async () => {
      try {
        return text(await listRuntimeSpecs())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "create_runtime",
    {
      title: "New runtime",
      description: "Creates a Colab runtime and waits. Slow + quota-limited — reuse first.",
      inputSchema: z.object({ spec: z.string().describe("Spec from list_runtime_specs.").optional() }),
    },
    async ({ spec }) => {
      try {
        return text(await createRuntime(spec ?? ""))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "create_session",
    {
      title: "New session",
      description: "Opens a Jupyter kernel session on a runtime.",
      inputSchema: z.object({ runtime: z.string().describe("runtimes/{id}."), session: z.string().optional() }),
    },
    async ({ runtime, session }) => {
      try {
        return text(await createSession(runtime, session ?? ""))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "execute_code",
    {
      title: "Run code",
      description: "Runs Python in a session. Long jobs: poll by re-sending same session+executionId.",
      inputSchema: z.object({
        code: z.string().describe("Python source."),
        session: z.string().describe("Session name.").optional(),
        runtime: z.string().describe("Runtime name (new session).").optional(),
        execution_id: z.string().describe("UUID for reattach.").optional(),
      }),
    },
    async ({ code, session, runtime, execution_id }) => {
      try {
        return text(await executeCode(code, session ?? "", runtime ?? "", execution_id ?? ""))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
