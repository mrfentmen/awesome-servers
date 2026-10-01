import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, compareSchemaShapes } from "./core.js"
import { keyVocabulary, nestingProfile, schemaProfile } from "./api.js"
import { premiumRequired } from "./license.js"
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const text=(value:string)=>({content:[{type:"text" as const,text:value}]})
const errorText=(error:unknown)=>text(`Error: ${error instanceof Error?error.message:String(error)}`)
export function createServer(){const server=new McpServer({name:"schema-compatibility-mcp",version:"1.0.0"});server.registerTool(
    "compare_schema_shapes",
    {
      title: "Compare schema shapes",
      description: "Compare local JSON schema shape fingerprints without returning property names, values, paths, or schema text.",
      inputSchema: z.object({before: z.string().min(1).max(1000), after: z.string().min(1).max(1000)}),
      annotations: READ_ONLY,
    },
    async(input)=>{try{return text(format(await compareSchemaShapes(input)))}catch(error){return errorText(error)}}
  )
  server.registerTool(
    "schema_profile",
    {
      title: "Schema profile",
      description: "Keyword census of a local JSON Schema document: how many times each schema keyword appears, how many reusable definitions and enums and required lists it declares, and how deep it nests. Counts only, no property names, values, paths or schema text.",
      inputSchema: z.object({ schema: z.string().min(1).max(1000).describe("Path to a local JSON Schema file inside the configured root") }),
      annotations: READ_ONLY,
    },
    async (input) => {
    // ---- paywall: schema_profile ----
    const paywallMessage = await premiumRequired("schema_profile")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await schemaProfile(input)) } catch (error) { return errorText(error) }
  }
  )

  server.registerTool(
    "nesting_profile",
    {
      title: "Nesting profile",
      description: "Depth and breadth of a local JSON document: nodes per level, deepest nesting and what reached it, object fan-out, and the array length distribution. Counts only, no property names, values or paths.",
      inputSchema: z.object({ document: z.string().min(1).max(1000).describe("Path to a local JSON file inside the configured root") }),
      annotations: READ_ONLY,
    },
    async (input) => {
    try { return text(await nestingProfile(input)) } catch (error) { return errorText(error) }
  }
  )

  server.registerTool(
    "key_vocabulary",
    {
      title: "Key vocabulary",
      description: "How varied a local JSON document's property-name vocabulary is: distinct names, how many are used once, reuse rate, Shannon entropy of the usage distribution and name length. No property name is ever printed.",
      inputSchema: z.object({ document: z.string().min(1).max(1000).describe("Path to a local JSON file inside the configured root") }),
      annotations: READ_ONLY,
    },
    async (input) => {
    // ---- paywall: key_vocabulary ----
    const paywallMessage = await premiumRequired("key_vocabulary")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await keyVocabulary(input)) } catch (error) { return errorText(error) }
  }
  )

  return server
}
