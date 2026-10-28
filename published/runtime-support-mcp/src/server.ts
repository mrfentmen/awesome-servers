import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectRuntimeSupport } from "./core.js"
const text=(value:string)=>({content:[{type:"text" as const,text:value}]})
const errorText=(error:unknown)=>text(`Error: ${error instanceof Error?error.message:String(error)}`)
export function createServer(){const server=new McpServer({name:"runtime-support-mcp",version:"1.0.0"});server.tool("inspect_runtime_support","Summarize runtime declarations across local manifests and CI files without returning versions, paths, or source.",{project: z.string().min(1).max(1000).default(".")},async(input)=>{try{return text(format(await inspectRuntimeSupport(input)))}catch(error){return errorText(error)}});return server}
