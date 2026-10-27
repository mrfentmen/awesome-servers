import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listCharges, listCustomers, getBalance, listInvoices, listSubscriptions, listProducts, listPrices, listRefunds, listDisputes, listCoupons, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "stripe-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_charges", {
        title: "List charges",
        description: "Most recent charges, with amount, currency and status.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listCharges(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_customers", {
        title: "List customers",
        description: "Most recent customers, with email and created date.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listCustomers(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_balance", {
        title: "Balance",
        description: "Available and pending balance by currency.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getBalance());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_invoices", {
        title: "List invoices",
        description: "Recent invoices.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listInvoices(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_subscriptions", {
        title: "Subscriptions",
        description: "Active subscriptions.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listSubscriptions(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_products", {
        title: "Products",
        description: "Product catalog.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listProducts(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_prices", {
        title: "Prices",
        description: "Price list.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listPrices(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_refunds", {
        title: "Refunds",
        description: "Recent refunds.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listRefunds(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_disputes", {
        title: "Disputes",
        description: "Charge disputes.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listDisputes(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_coupons", {
        title: "Coupons",
        description: "Coupons.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listCoupons(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
