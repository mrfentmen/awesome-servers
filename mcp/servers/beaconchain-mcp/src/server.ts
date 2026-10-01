import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getChainState,
  getValidatorRewards,
  getLatestEpoch,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "beaconchain-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_chain_state",
    {
      title: "Get chain state",
      description: "Current Ethereum beacon chain state from beaconcha.in.",
      inputSchema: z.object({
        chain: z.string().default("mainnet").describe("Chain: mainnet or hoodi"),
      }),
      annotations: READ_ONLY,
    },
    async ({ chain }) => {
      try {
        return text(await getChainState(chain));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_validator_rewards",
    {
      title: "Get validator rewards",
      description: "Rewards for beacon chain validators by index.",
      inputSchema: z.object({
        validators: z.string().describe("Comma-separated validator indices, e.g. '1,2,3'"),
        epoch: z.number().optional().describe("Epoch number, default latest"),
        chain: z.string().default("mainnet").describe("Chain"),
      }),
      annotations: READ_ONLY,
    },
    async ({ validators, epoch, chain }) => {
      try {
        return text(await getValidatorRewards(validators, epoch, chain));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_latest_epoch",
    {
      title: "Get latest epoch",
      description: "Latest beacon chain epoch summary (V1 API).",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getLatestEpoch());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
