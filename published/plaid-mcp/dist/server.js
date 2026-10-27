import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listInstitutions, listCategories, sandboxToken, getInstitution, sandboxBalance, sandboxTransactions, sandboxHoldings, sandboxLiabilities, sandboxAuth, sandboxIdentity, findBank, bankHealth, banksByState } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const MUTATING = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "plaid-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_institutions", {
        title: "List institutions",
        description: "Sandbox banks available for testing.",
        inputSchema: z.object({
            count: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ count }) => {
        try {
            return text(await listInstitutions(count));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_categories", {
        title: "List categories",
        description: "Personal finance categories Plaid can return.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listCategories());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("sandbox_token", {
        title: "Sandbox token",
        description: "Create a test public token (sandbox only).",
        inputSchema: z.object({
            institution_id: z.string().describe("Institution ID (default ins_109508).").optional()
        }),
        annotations: MUTATING,
    }, async ({ institution_id }) => {
        try {
            return text(await sandboxToken(institution_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_institution", {
        title: "Institution details",
        description: "By ID.",
        inputSchema: z.object({
            institution_id: z.string().describe("Institution ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ institution_id }) => {
        try {
            return text(await getInstitution(institution_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("sandbox_balance", {
        title: "Account balances",
        description: "Needs sandbox access token.",
        inputSchema: z.object({
            access_token: z.string().describe("Sandbox access token.")
        }),
        annotations: READ_ONLY,
    }, async ({ access_token }) => {
        try {
            return text(await sandboxBalance(access_token));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("sandbox_transactions", {
        title: "Transactions sync",
        description: "Needs sandbox access token.",
        inputSchema: z.object({
            access_token: z.string().describe("Sandbox access token."),
            days: z.string().describe("Lookback days (default 30, max 730).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ access_token, days }) => {
        try {
            return text(await sandboxTransactions(access_token, days));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("sandbox_holdings", {
        title: "Holdings",
        description: "Investment holdings.",
        inputSchema: z.object({
            access_token: z.string().describe("Sandbox access token.")
        }),
        annotations: READ_ONLY,
    }, async ({ access_token }) => {
        try {
            return text(await sandboxHoldings(access_token));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("sandbox_liabilities", {
        title: "Liabilities",
        description: "Loans/credit.",
        inputSchema: z.object({
            access_token: z.string().describe("Sandbox access token.")
        }),
        annotations: READ_ONLY,
    }, async ({ access_token }) => {
        try {
            return text(await sandboxLiabilities(access_token));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("sandbox_auth", {
        title: "Auth numbers",
        description: "Account/routing.",
        inputSchema: z.object({
            access_token: z.string().describe("Sandbox access token.")
        }),
        annotations: READ_ONLY,
    }, async ({ access_token }) => {
        try {
            return text(await sandboxAuth(access_token));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("sandbox_identity", {
        title: "Identity",
        description: "Account holder.",
        inputSchema: z.object({
            access_token: z.string().describe("Sandbox access token.")
        }),
        annotations: READ_ONLY,
    }, async ({ access_token }) => {
        try {
            return text(await sandboxIdentity(access_token));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("find_bank", {
        title: "Find a US bank",
        description: "Look a US bank up in the FDIC call-report database by name: certificate number, headquarters, founding date, total assets and deposits, and regulator.",
        inputSchema: z.object({
            name: z.string().describe("Bank name, e.g. 'JPMorgan Chase' or 'First Citizens'"),
            limit: z.number().describe("Max matches, 1-20. Defaults to 5.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await findBank(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("bank_health", {
        title: "Bank health",
        description: "One bank's quarterly call-report health: assets, deposits, net income, return on assets, return on equity and net interest margin across the filed quarters.",
        inputSchema: z.object({
            cert: z.string().describe("FDIC certificate number, the digits after the routing number, e.g. '3511'"),
            quarters: z.number().describe("How many quarters, 2-20. Defaults to 8.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await bankHealth(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("banks_by_state", {
        title: "Largest banks in a state",
        description: "The largest active banks headquartered in a US state by total assets, with their deposit base, certificate number and city.",
        inputSchema: z.object({
            state: z.string().describe("Two-letter US state code, e.g. 'OH'"),
            limit: z.number().describe("Max banks, 1-25. Defaults to 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await banksByState(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
