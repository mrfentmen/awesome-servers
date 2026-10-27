import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listPlans, listCustomers, listInvoices, invoiceArithmetic, usageBill } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "lago-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_plans", {
        title: "List plans",
        description: "Billing plans with interval and amount.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 20, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listPlans(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_customers", {
        title: "List customers",
        description: "Billing customers with id and currency.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 20, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listCustomers(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_invoices", {
        title: "List invoices",
        description: "Invoices with status, amount and billing period.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 20, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listInvoices(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("invoice_arithmetic", {
        title: "Invoice arithmetic",
        description: "Recompute an invoice from its own line items: quantity times unit price, line and order discounts, tax, and the running total, with every gap to the declared figures called out. Reads no account, needs no key.",
        inputSchema: z.object({ invoice: z.string().describe("The invoice as JSON, e.g. {\"currency\":\"USD\",\"lines\":[{\"description\":\"Seats\",\"quantity\":10,\"unit_price\":25,\"tax_rate\":0.2}],\"total\":300}") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await invoiceArithmetic(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("usage_bill", {
        title: "Usage bill",
        description: "Price one usage bill against an included-then-overage plan: overage units, bill total, effective price per unit, the hard cap effect, the break-even usage and the bill curve at four usage levels. No account, no key.",
        inputSchema: z.object({ base_price: z.number().describe("Subscription base price."), included_units: z.number().describe("Units included in the base price."), overage_unit_price: z.number().describe("Price per unit beyond the included allowance."), usage: z.number().describe("Units actually used."), hard_cap_units: z.number().describe("Optional cap on chargeable units.").optional(), minimum_charge: z.number().describe("Optional floor for the bill.").optional(), currency: z.string().describe("ISO currency code, default USD.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await usageBill(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "lago-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    server.registerTool("timestamp", {
        title: "Timestamp",
        description: "Get the current UTC timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(new Date().toISOString());
    });
    return server;
}
