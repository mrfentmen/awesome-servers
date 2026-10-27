import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, ping, listLists, listMembers, listCampaigns, listDetails, memberDetails, campaignDetails, automations, segments, campaignReport, audienceHygieneAudit, emailComplianceScan } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "mailchimp-mcp",
        version: "1.0.0",
    });
    server.registerTool("ping", {
        title: "Ping",
        description: "Check that the Mailchimp API key still works.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await ping());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_lists", {
        title: "List audiences",
        description: "Mailchimp audiences, with member counts.",
        inputSchema: z.object({
            count: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ count }) => {
        try {
            return text(await listLists(count));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_members", {
        title: "List members",
        description: "Members of one audience, with status and email.",
        inputSchema: z.object({
            list_id: z.string().describe("Audience ID."),
            count: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ list_id, count }) => {
        try {
            return text(await listMembers(list_id, count));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_campaigns", {
        title: "List campaigns",
        description: "Sent and scheduled campaigns, newest first.",
        inputSchema: z.object({
            count: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ count }) => {
        try {
            return text(await listCampaigns(count));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_details", {
        title: "Audience details",
        description: "Single audience.",
        inputSchema: z.object({
            list_id: z.string().describe("Audience ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ list_id }) => {
        try {
            return text(await listDetails(list_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("member_details", {
        title: "Member details",
        description: "Member by email.",
        inputSchema: z.object({
            list_id: z.string().describe("Audience ID."),
            email: z.string().describe("Member email.")
        }),
        annotations: READ_ONLY,
    }, async ({ list_id, email }) => {
        try {
            return text(await memberDetails(list_id, email));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("campaign_details", {
        title: "Campaign details",
        description: "Single campaign.",
        inputSchema: z.object({
            campaign_id: z.string().describe("Campaign ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ campaign_id }) => {
        try {
            return text(await campaignDetails(campaign_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("automations", {
        title: "Automations",
        description: "Customer journeys.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await automations());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("segments", {
        title: "Segments",
        description: "Audience segments.",
        inputSchema: z.object({
            list_id: z.string().describe("Audience ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ list_id }) => {
        try {
            return text(await segments(list_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("campaign_report", {
        title: "Campaign report",
        description: "Opens/clicks.",
        inputSchema: z.object({
            campaign_id: z.string().describe("Campaign ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ campaign_id }) => {
        try {
            return text(await campaignReport(campaign_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("audience_hygiene_audit", {
        title: "Audience hygiene audit",
        description: "Whether a pasted address list can be mailed: syntax errors, addresses repeated on the list, role accounts, and for every distinct domain whether it publishes MX records, with the share of the list that is routable.",
        inputSchema: z.object({ addresses: z.string().describe("Addresses, one per line or comma-separated."), checkDns: z.boolean().default(true).describe("Look up MX for each distinct domain (default true).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await audienceHygieneAudit(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("email_compliance_scan", {
        title: "Email compliance scan",
        description: "Pre-flight scan of campaign HTML: unsubscribe link, List-Unsubscribe, postal address, preheader, text/plain part, tracking pixels, missing alt text, non-https links and link hosts.",
        inputSchema: z.object({ html: z.string().describe("The campaign HTML to scan."), limit: z.number().int().min(1).max(40).default(10).describe("How many link hosts to list (default 10, max 40).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await emailComplianceScan(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
