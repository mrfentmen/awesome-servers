import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectRuntimeSupport } from "./core.js"
import { runtimeConstraintSpread, runtimeSupportMatrix } from "./api.js"
import { premiumRequired } from "./license.js"
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const text=(value:string)=>({content:[{type:"text" as const,text:value}]})
const errorText=(error:unknown)=>text(`Error: ${error instanceof Error?error.message:String(error)}`)
export function createServer(){const server=new McpServer({name:"runtime-support-mcp",version:"1.0.0"});server.registerTool(
    "inspect_runtime_support",
    {
      title: "Inspect runtime support",
      description: "Summarize runtime declarations across local manifests and CI files without returning versions, paths, or source.",
      inputSchema: z.object({project: z.string().min(1).max(1000).default(".")}),
      annotations: READ_ONLY,
    },
    async(input)=>{try{return text(format(await inspectRuntimeSupport(input)))}catch(error){return errorText(error)}}
  );
  server.registerTool(
    "runtime_support_matrix",
    {
      title: "Runtime support matrix",
      description: "Build a runtime family by file-category matrix from local manifests, pin files, container files and CI files, then report per-family coverage, version-constraint presence and the gaps. Values, paths and filenames are never returned.",
      inputSchema: z.object({ project: z.string().min(1).max(1000).default(".").describe("Local project directory; no URLs") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: runtime_support_matrix ----
    const paywallMessage = await premiumRequired("runtime_support_matrix")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await runtimeSupportMatrix(args)) } catch (error) { return errorText(error) }
  }
  )
  server.registerTool(
    "runtime_constraint_spread",
    {
      title: "Runtime constraint spread",
      description: "Measure how many distinct major versions each runtime family names across local manifests and CI files, and flag families whose constraints contradict each other. Exact versions are never returned, only counts and spreads.",
      inputSchema: z.object({ project: z.string().min(1).max(1000).default(".").describe("Local project directory; no URLs") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await runtimeConstraintSpread(args)) } catch (error) { return errorText(error) }
  }
  )
;return server}
