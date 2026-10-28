import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, compareSchemaShapes } from "./core.js"
const text=(value:string)=>({content:[{type:"text" as const,text:value}]})
const errorText=(error:unknown)=>text(`Error: ${error instanceof Error?error.message:String(error)}`)
export function createServer(){const server=new McpServer({name:"schema-compatibility-mcp",version:"1.0.0"});server.tool("compare_schema_shapes","Compare local JSON schema shape fingerprints without returning property names, values, paths, or schema text.",{before: z.string().min(1).max(1000), after: z.string().min(1).max(1000)},async(input)=>{try{return text(format(await compareSchemaShapes(input)))}catch(error){return errorText(error)}});return server}
