import { contractShape, contractRisk } from "./api.js"
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { compareSnapshots, format } from "./diff.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() { const server = new McpServer({ name: "contract-diff-mcp", version: "1.0.0" }); server.registerTool(
    "compare_contract_snapshots",
    {
      title: "Compare contract snapshots",
      description: "Compare two local JSON contract snapshots using a coarse structural fingerprint; schema names, paths, values, and versions are never returned.",
      inputSchema: z.object( { before: z.string().min(1).max(1000), after: z.string().min(1).max(1000) }),
      annotations: READ_ONLY,
    },
    async ({ before, after }) => { try { return text(format(await compareSnapshots(before, after))) } catch (error) { return errorText(error) } }
  );
  server.registerTool(
    "contract_shape",
    {
      title: "Contract shape",
      description: "Profile one local JSON contract snapshot by shape rather than by content: how many nodes it holds, its maximum nesting depth, how many nodes sit at each level, how many objects against arrays against scalar leaves, how many explicit nulls, the widest single node, the longest array, and the value types present. The compare tool only ever looks at two snapshots and never reports any of this.",
      inputSchema: z.object({ snapshot: z.string().min(1).max(1000).describe("Path of one local JSON snapshot.") }),
      annotations: READ_ONLY,
    },
    async ({ snapshot }) => {
      try { return text(await contractShape({ snapshot })) } catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "contract_risk",
    {
      title: "Contract risk",
      description: "Read two local JSON contract snapshots for coarse compatibility signals and give a verdict: which value types disappeared entirely, which are new, whether the document got shallower, whether objects were lost, whether arrays and nulls grew, with every figure stated. The compare tool reports the same counts but flags nothing and never notices a type that vanished.",
      inputSchema: z.object({
        before: z.string().min(1).max(1000).describe("Earlier snapshot path."),
        after: z.string().min(1).max(1000).describe("Later snapshot path."),
      }),
      annotations: READ_ONLY,
    },
    async ({ before, after }) => {
      try { return text(await contractRisk({ before, after })) } catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "public_api_versions",
    {
      title: "Public api versions",
      description: "Look up published API contract versions, specification format and update dates in the public APIs.guru directory.",
      inputSchema: z.object({ api: z.string().max(200).optional(), limit: z.number().int().min(1).max(30).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement versions locally (paywall removed)
    try { return textError("Not yet implemented: versions") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "public_api_operations",
    {
      title: "Public api operations",
      description: "Inspect the operation surface and documented response codes of a public OpenAPI contract hosted by APIs.guru. Does not call the described API or resolve external references.",
      inputSchema: z.object({ api: z.string().max(200).optional(), version: z.string().max(100).optional(), limit: z.number().int().min(1).max(40).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement operations locally (paywall removed)
    try { return textError("Not yet implemented: operations") } catch (e) { return textError(String(e)) }
  }
  )

  return server }
