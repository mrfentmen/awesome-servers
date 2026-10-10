import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, getOrder, getCapture, listPlans, planDetails, listProducts, productDetails, subscriptionDetails, payoutDetails, listWebhooks, disputeDetails, payoutMarketProfile, payoutFxTrend, payoutMarketScan } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "paypal-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_order", {
        title: "Get order",
        description: "One order by id, with status, amount and payer.",
        inputSchema: z.object({
            order_id: z.string().describe("PayPal order ID, e.g. 5O190127TN364715T")
        }),
        annotations: READ_ONLY,
    }, async ({ order_id }) => {
        try {
            return text(await getOrder(order_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_capture", {
        title: "Get capture",
        description: "One payment capture by id, with amount and status.",
        inputSchema: z.object({
            capture_id: z.string().describe("Capture ID from the order response")
        }),
        annotations: READ_ONLY,
    }, async ({ capture_id }) => {
        try {
            return text(await getCapture(capture_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_plans", {
        title: "List plans",
        description: "Billing plans on the account, with id and status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listPlans());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("plan_details", {
        title: "Plan details",
        description: "Billing plan.",
        inputSchema: z.object({
            plan_id: z.string().describe("Plan ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ plan_id }) => {
        try {
            return text(await planDetails(plan_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_products", {
        title: "List products",
        description: "Catalog products.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listProducts());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("product_details", {
        title: "Product details",
        description: "Catalog product.",
        inputSchema: z.object({
            product_id: z.string().describe("Product ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ product_id }) => {
        try {
            return text(await productDetails(product_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("subscription_details", {
        title: "Subscription",
        description: "Subscription details.",
        inputSchema: z.object({
            subscription_id: z.string().describe("Subscription ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ subscription_id }) => {
        try {
            return text(await subscriptionDetails(subscription_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("payout_details", {
        title: "Payout details",
        description: "Payout batch.",
        inputSchema: z.object({
            payout_id: z.string().describe("Payout batch ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ payout_id }) => {
        try {
            return text(await payoutDetails(payout_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_webhooks", {
        title: "Webhooks",
        description: "Registered webhooks.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listWebhooks());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("dispute_details", {
        title: "Dispute details",
        description: "Customer dispute.",
        inputSchema: z.object({
            dispute_id: z.string().describe("Dispute ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ dispute_id }) => {
        try {
            return text(await disputeDetails(dispute_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("payout_market_profile", {
        title: "Payout market profile",
        description: "The payout picture for one market: its World Bank region and income tier, the official exchange rate against the dollar, and how that rate has moved over the last five published years.",
        inputSchema: z.object({
            country: z.string().describe("Country name or ISO code, e.g. 'Brazil', 'BR' or 'BRA'"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: payout_market_profile ----
        const paywallMessage = await premiumRequired("payout_market_profile");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await payoutMarketProfile(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("payout_fx_trend", {
        title: "Payout FX trend",
        description: "The year-by-year official exchange rate for one market against the US dollar, with each year's change and the cumulative move over the window.",
        inputSchema: z.object({
            country: z.string().describe("Country name or ISO code, e.g. 'Japan' or 'JPN'"),
            years: z.number().describe("Window length in years, 2-20. Defaults to 8.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await payoutFxTrend(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("payout_market_scan", {
        title: "Payout market scan",
        description: "Rank payout markets in a region or income tier: each economy's official rate against the dollar, its GDP per capita and its ten-year move.",
        inputSchema: z.object({
            region: z.string().describe("Region name fragment, e.g. 'East Asia' or 'Sub-Saharan'").optional(),
            income_level: z.string().describe("Income tier fragment, e.g. 'upper middle income'").optional(),
            limit: z.number().describe("Max markets, 1-15. Defaults to 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: payout_market_scan ----
        const paywallMessage = await premiumRequired("payout_market_scan");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await payoutMarketScan(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
