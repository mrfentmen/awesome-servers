import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, compareLicenseEvidence } from "./core.js"
import { snapshotProfile } from "./api.js"
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const text=(value:string)=>({content:[{type:"text" as const,text:value}]})
const errorText=(error:unknown)=>text(`Error: ${error instanceof Error?error.message:String(error)}`)
export function createServer(){const server=new McpServer({name:"dependency-license-change-mcp",version:"1.0.0"});server.registerTool(
    "compare_license_evidence",
    {
      title: "Compare license evidence",
      description: "Compare local license evidence across two snapshots without returning package names, text, paths, or source.",
      inputSchema: z.object({before: z.string().min(1).max(1000), after: z.string().min(1).max(1000)}),
      annotations: READ_ONLY,
    },
    async(input)=>{try{return text(format(await compareLicenseEvidence(input)))}catch(error){return errorText(error)}}
  );  server.registerTool(
    "snapshot_profile",
    {
      title: "Snapshot profile",
      description: "Profile one snapshot on its own: how many licence bearing files it holds, the count and share of every category, the dominant one and whether anything falls in the strong copyleft family. The compare_license_evidence tool only reports categories whose count moved between two snapshots, so it cannot show a single snapshot or a category that held steady.",
      inputSchema: z.object({ path: z.string().min(1).max(1000).describe("Snapshot path, relative to the configured root or absolute.") }),
      annotations: READ_ONLY,
    },
    async (input) => {
      try { return text(await snapshotProfile(input)) } catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "category_matrix",
    {
      title: "Category matrix",
      description: "Every licence category across two snapshots, changed or not, each with its before and after count, its share, the size of the move and the categories that held steady. The compare_license_evidence tool omits the unchanged categories entirely, so a flat movement is invisible there.",
      inputSchema: z.object({ before: z.string().min(1).max(1000).describe("First snapshot path."), after: z.string().min(1).max(1000).describe("Second snapshot path.") }),
      annotations: READ_ONLY,
    },
    async (input) => {
      // TODO: implement matrix locally (paywall removed)
      try { return textError("Not yet implemented: matrix") } catch (e) { return textError(String(e)) }
    }
  )

return server}
