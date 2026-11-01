import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  IncreaseError,
  approveAchTransfer,
  approveWireTransfer,
  cancelAchTransfer,
  cancelWireTransfer,
  createAccount,
  createAccountNumber,
  createAchTransfer,
  createCard,
  createCheckTransfer,
  createEntity,
  createWireTransfer,
  formatAccount,
  formatAccountNumber,
  formatCard,
  formatCents,
  formatEntity,
  formatEvent,
  formatLimit,
  formatList,
  formatRoutingNumber,
  formatStatement,
  formatTransaction,
  formatTransfer,
  getAccount,
  getAccountNumber,
  getAchTransfer,
  getCard,
  getCheckTransfer,
  getEntity,
  getLimit,
  getTransaction,
  getWireTransfer,
  listAccountNumbers,
  listAccounts,
  listAccountStatements,
  listAchTransfers,
  listCards,
  listCheckTransfers,
  listDeclinedTransactions,
  listEntities,
  listEvents,
  listLimits,
  listPendingTransactions,
  listRoutingNumbers,
  listTransactions,
  listWireTransfers,
  stopCheckPayment,
  updateAccount,
  updateCard,
  type Query,
} from "./api.js"

function text(body: string) {
  return { content: [{ type: "text" as const, text: body }] }
}

function fail(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true }
}

function errorMessage(e: unknown): string {
  if (e instanceof IncreaseError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const listArgs = {
  limit: z.number().int().min(1).max(200).optional().describe("Page size (Increase default is 100, max 200)."),
  cursor: z.string().optional().describe("Cursor from a previous response's next_cursor."),
  createdAtGreaterThan: z.string().optional().describe("ISO 8601 timestamp; only objects created after it."),
  createdAtLessThan: z.string().optional().describe("ISO 8601 timestamp; only objects created before it."),
}

function toQuery(args: {
  limit?: number
  cursor?: string
  createdAtGreaterThan?: string
  createdAtLessThan?: string
}): Query {
  const query: Query = { limit: args.limit, cursor: args.cursor }
  if (args.createdAtGreaterThan || args.createdAtLessThan) {
    const filter: Record<string, string> = {}
    if (args.createdAtGreaterThan) filter.greater_than = args.createdAtGreaterThan
    if (args.createdAtLessThan) filter.less_than = args.createdAtLessThan
    query.created_at = filter
  }
  return query
}

const idArg = { id: z.string().min(1).describe("Increase object id.") }
const bodyArg = { body: z.record(z.unknown()).describe("Increase request body (JSON object), passed through unchanged.") }

export function createServer(): McpServer {
  const server = new McpServer({ name: "increase-mcp", version: "1.0.0" })

  /* Accounts ------------------------------------------------------- */

  server.tool("list_accounts", "List Increase accounts with balances (integer cents).", listArgs, async (args) => {
    try {
      const page = await listAccounts(toQuery(args))
      return text(formatList(page, formatAccount, "No accounts found."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("get_account", "Fetch one Increase account by id.", idArg, async ({ id }) => {
    try {
      return text(formatAccount(await getAccount(id)))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "create_account",
    "Create an Increase account. The body is the Increase accounts payload: { name, entity_id, program_id, ... }. Movement of real money.",
    { ...bodyArg, idempotencyKey: z.string().optional().describe("Idempotency key so a retry cannot create a duplicate.") },
    async ({ body, idempotencyKey }) => {
      try {
        return text(formatAccount(await createAccount(body, idempotencyKey)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_account",
    "Update an Increase account. The body is the Increase accounts PATCH payload (for example { name }).",
    { ...idArg, ...bodyArg },
    async ({ id, body }) => {
      try {
        return text(formatAccount(await updateAccount(id, body)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* Account numbers ------------------------------------------------ */

  server.tool("list_account_numbers", "List account numbers (ABA/routing + account) belonging to the organization.", listArgs, async (args) => {
    try {
      const page = await listAccountNumbers(toQuery(args))
      return text(formatList(page, formatAccountNumber, "No account numbers found."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("get_account_number", "Fetch one account number by id.", idArg, async ({ id }) => {
    try {
      return text(formatAccountNumber(await getAccountNumber(id)))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "create_account_number",
    "Create an account number. The body is the Increase account_numbers payload: { account_id, inbound_checks, ... }.",
    { ...bodyArg, idempotencyKey: z.string().optional() },
    async ({ body, idempotencyKey }) => {
      try {
        return text(formatAccountNumber(await createAccountNumber(body, idempotencyKey)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* Transactions --------------------------------------------------- */

  server.tool("list_transactions", "List settled Increase transactions. Amounts are integer cents.", listArgs, async (args) => {
    try {
      const page = await listTransactions(toQuery(args))
      return text(formatList(page, formatTransaction, "No transactions found."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("get_transaction", "Fetch one transaction by id.", idArg, async ({ id }) => {
    try {
      return text(formatTransaction(await getTransaction(id)))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("list_pending_transactions", "List pending (not yet settled) transactions.", listArgs, async (args) => {
    try {
      const page = await listPendingTransactions(toQuery(args))
      return text(formatList(page, formatTransaction, "No pending transactions."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("list_declined_transactions", "List declined transactions.", listArgs, async (args) => {
    try {
      const page = await listDeclinedTransactions(toQuery(args))
      return text(formatList(page, formatTransaction, "No declined transactions."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  /* ACH ------------------------------------------------------------ */

  server.tool("list_ach_transfers", "List ACH transfers.", listArgs, async (args) => {
    try {
      const page = await listAchTransfers(toQuery(args))
      return text(formatList(page, (t) => formatTransfer(t, "ACH transfer"), "No ACH transfers found."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("get_ach_transfer", "Fetch one ACH transfer by id.", idArg, async ({ id }) => {
    try {
      return text(formatTransfer(await getAchTransfer(id), "ACH transfer"))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "create_ach_transfer",
    "Create an ACH transfer. The body is the Increase ach_transfers payload: { account_id, amount (integer cents), statement_descriptor, ... }. Moves real money.",
    { ...bodyArg, idempotencyKey: z.string().optional() },
    async ({ body, idempotencyKey }) => {
      try {
        return text(formatTransfer(await createAchTransfer(body, idempotencyKey), "ACH transfer"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "approve_ach_transfer",
    "Approve a pending ACH transfer. Irreversible — the transfer leaves the account.",
    idArg,
    async ({ id }) => {
      try {
        return text(formatTransfer(await approveAchTransfer(id), "ACH transfer (approved)"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("cancel_ach_transfer", "Cancel an ACH transfer that has not settled yet.", idArg, async ({ id }) => {
    try {
      return text(formatTransfer(await cancelAchTransfer(id), "ACH transfer (cancelled)"))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  /* Wires ---------------------------------------------------------- */

  server.tool("list_wire_transfers", "List wire transfers.", listArgs, async (args) => {
    try {
      const page = await listWireTransfers(toQuery(args))
      return text(formatList(page, (t) => formatTransfer(t, "Wire transfer"), "No wire transfers found."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("get_wire_transfer", "Fetch one wire transfer by id.", idArg, async ({ id }) => {
    try {
      return text(formatTransfer(await getWireTransfer(id), "Wire transfer"))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "create_wire_transfer",
    "Create a wire transfer. The body is the Increase wire_transfers payload: { account_id, amount (integer cents), beneficiary_name, ... }. Moves real money.",
    { ...bodyArg, idempotencyKey: z.string().optional() },
    async ({ body, idempotencyKey }) => {
      try {
        return text(formatTransfer(await createWireTransfer(body, idempotencyKey), "Wire transfer"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "approve_wire_transfer",
    "Approve a pending wire transfer. Irreversible — the wire is sent.",
    idArg,
    async ({ id }) => {
      try {
        return text(formatTransfer(await approveWireTransfer(id), "Wire transfer (approved)"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("cancel_wire_transfer", "Cancel a wire transfer that has not been sent yet.", idArg, async ({ id }) => {
    try {
      return text(formatTransfer(await cancelWireTransfer(id), "Wire transfer (cancelled)"))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  /* Checks --------------------------------------------------------- */

  server.tool("list_check_transfers", "List paper-check transfers and their mailing status.", listArgs, async (args) => {
    try {
      const page = await listCheckTransfers(toQuery(args))
      return text(formatList(page, (t) => formatTransfer(t, "Check transfer"), "No check transfers found."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("get_check_transfer", "Fetch one check transfer by id.", idArg, async ({ id }) => {
    try {
      return text(formatTransfer(await getCheckTransfer(id), "Check transfer"))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "create_check_transfer",
    "Create a check transfer (Increase prints and mails the cheque). The body is the Increase check_transfers payload: { account_id, amount (integer cents), mailing_address, ... }.",
    { ...bodyArg, idempotencyKey: z.string().optional() },
    async ({ body, idempotencyKey }) => {
      try {
        return text(formatTransfer(await createCheckTransfer(body, idempotencyKey), "Check transfer"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("stop_check_payment", "Stop payment on a check transfer that has been mailed.", idArg, async ({ id }) => {
    try {
      return text(formatTransfer(await stopCheckPayment(id), "Check transfer (stopped)"))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  /* Cards ---------------------------------------------------------- */

  server.tool("list_cards", "List issued cards.", listArgs, async (args) => {
    try {
      const page = await listCards(toQuery(args))
      return text(formatList(page, formatCard, "No cards found."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("get_card", "Fetch one card by id.", idArg, async ({ id }) => {
    try {
      return text(formatCard(await getCard(id)))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "create_card",
    "Issue a card. The body is the Increase cards payload: { account_id, description, ... }.",
    { ...bodyArg, idempotencyKey: z.string().optional() },
    async ({ body, idempotencyKey }) => {
      try {
        return text(formatCard(await createCard(body, idempotencyKey)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_card",
    "Update a card, for example to lock it after a suspected compromise. The body is the Increase cards PATCH payload (for example { status: \"disabled\" }).",
    { ...idArg, ...bodyArg },
    async ({ id, body }) => {
      try {
        return text(formatCard(await updateCard(id, body)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* Entities, limits, references ----------------------------------- */

  server.tool("list_entities", "List legal entities (companies, trusts, natural persons) on the account.", listArgs, async (args) => {
    try {
      const page = await listEntities(toQuery(args))
      return text(formatList(page, formatEntity, "No entities found."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("get_entity", "Fetch one entity by id.", idArg, async ({ id }) => {
    try {
      return text(formatEntity(await getEntity(id)))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "create_entity",
    "Create a legal entity. The body is the Increase entities payload: { name, structure, ... }.",
    { ...bodyArg, idempotencyKey: z.string().optional() },
    async ({ body, idempotencyKey }) => {
      try {
        return text(formatEntity(await createEntity(body, idempotencyKey)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("list_limits", "List transfer limits configured on the organization.", listArgs, async (args) => {
    try {
      const page = await listLimits(toQuery(args))
      return text(formatList(page, formatLimit, "No limits configured."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("get_limit", "Fetch one limit by id.", idArg, async ({ id }) => {
    try {
      return text(formatLimit(await getLimit(id)))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "list_routing_numbers",
    "List routing numbers Increase can use, so you can check one before creating a transfer.",
    { limit: listArgs.limit, cursor: listArgs.cursor },
    async (args) => {
      try {
        const page = await listRoutingNumbers(toQuery(args))
        return text(formatList(page, formatRoutingNumber, "No routing numbers returned."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("list_events", "List account events (the audit trail Increase publishes).", listArgs, async (args) => {
    try {
      const page = await listEvents(toQuery(args))
      return text(formatList(page, formatEvent, "No events found."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("list_account_statements", "List monthly account statements.", listArgs, async (args) => {
    try {
      const page = await listAccountStatements(toQuery(args))
      return text(formatList(page, formatStatement, "No statements found."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "format_amount",
    "Convert an integer cents value into a dollar string, so you can sanity-check an amount before sending it.",
    { cents: z.number().int().describe("Amount in integer cents, exactly as Increase stores it.") },
    async ({ cents }) => text(formatCents(cents))
  )

  return server
}
