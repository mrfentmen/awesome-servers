import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { createServer } from "./server.js"
const main=async()=>{const server=createServer();await server.connect(new StdioServerTransport());console.error("MCP server running on stdio")}
main().catch((error)=>{console.error("Fatal error:",error);process.exit(1)})
