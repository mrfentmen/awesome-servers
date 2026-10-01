import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, getBalance, getTransactions, getTokenTransfers, txStatus, contractAbi, contractSource, tokenBalance, gasOracle, ethPrice, blockNumber, internalTransactions, eventLogs, contractStateRead } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "etherscan-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_balance",
    {
      title: "ETH balance",
      description: "Native balance for an address.",
      inputSchema: z.object({
        address: z.string().describe("Address, e.g. 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"),
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ address, chain_id }) => {
      try {
        return text(await getBalance(address, chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_transactions",
    {
      title: "Transactions",
      description: "Recent normal transactions for an address.",
      inputSchema: z.object({
        address: z.string().describe("Address, e.g. 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"),
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ address, chain_id }) => {
      try {
        return text(await getTransactions(address, chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_token_transfers",
    {
      title: "Token transfers",
      description: "Recent ERC-20 transfers to or from an address.",
      inputSchema: z.object({
        address: z.string().describe("Address, e.g. 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"),
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ address, chain_id }) => {
      try {
        return text(await getTokenTransfers(address, chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "tx_status",
    {
      title: "TX status",
      description: "Receipt status by hash.",
      inputSchema: z.object({
        txhash: z.string().describe("Transaction hash."),
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ txhash, chain_id }) => {
      try {
        return text(await txStatus(txhash, chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "contract_abi",
    {
      title: "Contract ABI",
      description: "Verified ABI.",
      inputSchema: z.object({
        address: z.string().describe("Contract address."),
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ address, chain_id }) => {
      try {
        return text(await contractAbi(address, chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "contract_source",
    {
      title: "Contract source",
      description: "Verified source info.",
      inputSchema: z.object({
        address: z.string().describe("Contract address."),
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ address, chain_id }) => {
      try {
        return text(await contractSource(address, chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "token_balance",
    {
      title: "Token balance",
      description: "ERC-20 balance.",
      inputSchema: z.object({
        contract: z.string().describe("Token contract."),
        address: z.string().describe("0x address."),
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ contract, address, chain_id }) => {
      try {
        return text(await tokenBalance(contract, address, chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "gas_oracle",
    {
      title: "Gas prices",
      description: "Current gas tiers.",
      inputSchema: z.object({
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ chain_id }) => {
      try {
        return text(await gasOracle(chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "eth_price",
    {
      title: "ETH price",
      description: "ETH/USD price.",
      inputSchema: z.object({
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ chain_id }) => {
      try {
        return text(await ethPrice(chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "block_number",
    {
      title: "Block number",
      description: "Latest block.",
      inputSchema: z.object({
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ chain_id }) => {
      try {
        return text(await blockNumber(chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "internal_transactions",
    {
      title: "Internal transactions",
      description: "Lists value that moved through contract-to-contract calls for an address. The existing transactions tool only shows transactions where the address is the from or the to, so anything routed through a proxy, router or vault is invisible to it, which is the usual reason an address balance refuses to reconcile with its own history. Reports in and out totals, call types and reverted calls, and warns that a proxy makes the from and to describe code rather than an economic owner.",
      inputSchema: z.object({
        address: z.string().describe("Address to inspect, 0x plus 40 hex characters."),
        chain_id: z.string().optional().describe("Etherscan chainid, default 1 for Ethereum mainnet."),
        start_block: z.number().int().optional().describe("First block to scan."),
        end_block: z.number().int().optional().describe("Last block to scan, default latest."),
        page: z.number().int().min(1).max(10000).default(1).describe("Page of results, default 1"),
        offset: z.number().int().min(1).max(1000).default(50).describe("Records per page, default 50"),
        sort: z.enum(["asc", "desc"]).default("desc").describe("Sort order, default desc for newest first"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: internal_transactions ----
    const paywallMessage = await premiumRequired("internal_transactions")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await internalTransactions(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "event_logs",
    {
      title: "Event logs by address and topic",
      description: "Reads raw event logs for a block range filtered by contract address and up to three indexed topics, decoding Transfer and Approval into from, to, value and summing net movement. Any other event keeps its raw topic0 rather than being given a guessed name, since assigning a signature to an unrecognised hash would be confidently wrong. This is the workhorse for token-flow and event analysis and nothing else in this server covers it.",
      inputSchema: z.object({
        address: z.string().optional().describe("Contract address to filter logs by, 0x plus 40 hex characters."),
        topic0: z.string().optional().describe("Event signature hash, 0x plus 64 hex characters. Omit for any event type."),
        topic1: z.string().optional().describe("First indexed argument filter."),
        topic2: z.string().optional().describe("Second indexed argument filter."),
        from_block: z.number().int().min(0).describe("First block. Required: a log scan from genesis will be refused."),
        to_block: z.number().int().optional().describe("Last block, default latest."),
        chain_id: z.string().optional().describe("Etherscan chainid, default 1."),
        page: z.number().int().min(1).max(10000).default(1).describe("Page of results, default 1"),
        offset: z.number().int().min(1).max(1000).default(50).describe("Logs per page, default 50"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: event_logs ----
    const paywallMessage = await premiumRequired("event_logs")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await eventLogs(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "contract_state_read",
    {
      title: "Read contract state with eth_call",
      description: "Reads live contract state with a read-only eth_call, so it costs nothing, needs no gas and changes nothing. Decodes totalSupply, decimals, symbol, name, balanceOf, allowance, owner, paused, totalAssets and getPricePerShare when given the matching 4-byte selector, and shows the raw return otherwise rather than guessing. Refuses a bare function name, because the argument types are needed to encode it and a wrong guess would call the wrong function and return a plausible-looking wrong value.",
      inputSchema: z.object({
        contract: z.string().describe("Contract to read, 0x plus 40 hex characters."),
        function: z.string().describe("4-byte selector plus encoded arguments, e.g. 0x70a08231 or 0x70a08231000000000000000000000000address. A bare name is rejected."),
        chain_id: z.string().optional().describe("Etherscan chainid, default 1."),
        block: z.string().optional().describe("Block tag, default latest. Pass a number to read historical state."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await contractStateRead(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}