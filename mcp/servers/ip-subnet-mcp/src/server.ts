import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { checkIp, describeSubnet, splitSubnet, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "ip-subnet-mcp", version: "1.0.0" })

  server.tool(
    "describe_subnet",
    "Full breakdown of an IPv4 CIDR block: network, broadcast, mask, wildcard and usable host range.",
    {
      cidr: z.string().describe('IPv4 CIDR, e.g. "192.168.10.0/24"')
    },
    async (a) => {
      try {
        return text(await describeSubnet(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "check_ip",
    "Check whether an IPv4 address is inside a CIDR block.",
    {
      cidr: z.string().describe('IPv4 CIDR, e.g. "10.0.0.0/8"'),
      ip: z.string().describe('IPv4 address, e.g. "10.4.5.6"')
    },
    async (a) => {
      try {
        return text(await checkIp(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "split_subnet",
    "Split a CIDR block into equal smaller subnets with a longer prefix.",
    {
      cidr: z.string().describe('IPv4 CIDR to split'),
      newPrefix: z.number().int().min(1).max(32).describe("Prefix length of the smaller subnets")
    },
    async (a) => {
      try {
        return text(await splitSubnet(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
