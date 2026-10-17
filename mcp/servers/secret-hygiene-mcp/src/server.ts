import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, scanSecretHygiene } from "./core.js"
import { secretExposureLedger } from "./api.js"
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const text=(value:string)=>({content:[{type:"text" as const,text:value}]})
const errorText=(error:unknown)=>text(`Error: ${error instanceof Error?error.message:String(error)}`)
export function createServer(){const server=new McpServer({name:"secret-hygiene-mcp",version:"1.0.0"});server.registerTool(
    "scan_secret_hygiene",
    {
      title: "Scan secret hygiene",
      description: "Count secret-like patterns in bounded local files without returning values, keys, paths, filenames, or matches.",
      inputSchema: z.object({project: z.string().min(1).max(1000).default(".")}),
      annotations: READ_ONLY,
    },
    async(input)=>{try{return text(format(await scanSecretHygiene(input)))}catch(error){return errorText(error)}}
  );
  server.registerTool(
    "entropy_profile",
    {
      title: "Entropy profile",
      description: "Profile candidate secrets you supply: Shannon entropy per character, length, character-class composition, unique-character ratio and a strength band for each. No candidate value, fragment or derived substring is ever returned.",
      inputSchema: z.object( { candidates: z.array(z.string().max(4096)).min(1).max(50).describe("Candidate secret values to profile, up to 50 of 4096 characters each.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement profile locally (paywall removed)
    try { return textError("Not yet implemented: profile") } catch (e) { return textError(String(e)) }
  }
  ); server.registerTool(
    "secret_exposure_ledger",
    {
      title: "Secret exposure ledger",
      description: "Run a redacted ledger over text you supply: per-family hit counts, a match-by-match list of lengths and character-class shapes, duplicate-value detection and a rotate-or-clear verdict. Values, offsets, paths and source lines are never returned.",
      inputSchema: z.object( { text: z.string().min(1).max(200000).describe("Text to scan, up to 200,000 characters.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await secretExposureLedger(args)) } catch (error) { return errorText(error) }
  }
  );return server}
