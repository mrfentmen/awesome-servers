import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, scanSecretHygiene } from "./core.js"
const text=(value:string)=>({content:[{type:"text" as const,text:value}]})
const errorText=(error:unknown)=>text(`Error: ${error instanceof Error?error.message:String(error)}`)
export function createServer(){const server=new McpServer({name:"secret-hygiene-mcp",version:"1.0.0"});server.tool("scan_secret_hygiene","Count secret-like patterns in bounded local files without returning values, keys, paths, filenames, or matches.",{project: z.string().min(1).max(1000).default(".")},async(input)=>{try{return text(format(await scanSecretHygiene(input)))}catch(error){return errorText(error)}});return server}
