import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listProfiles, listLists, listCampaigns, profileDetails, listDetails, campaignDetails, metrics, events, flows, segments, disposableCheck, sendingReadiness } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "klaviyo-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_profiles", {
        title: "List profiles",
        description: "Customer profiles with email and location.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listProfiles());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_lists", {
        title: "List lists",
        description: "Marketing lists with subscriber counts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listLists());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_campaigns", {
        title: "List campaigns",
        description: "Klaviyo campaigns with status and send time.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listCampaigns());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("profile_details", {
        title: "Profile details",
        description: "Single profile.",
        inputSchema: z.object({
            profile_id: z.string().describe("Profile ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ profile_id }) => {
        try {
            return text(await profileDetails(profile_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_details", {
        title: "List details",
        description: "Single list.",
        inputSchema: z.object({
            list_id: z.string().describe("List ID.")
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
    server.registerTool("metrics", {
        title: "Metrics",
        description: "Event metrics.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await metrics());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("events", {
        title: "Events",
        description: "Recent events.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await events());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("flows", {
        title: "Flows",
        description: "Automation flows.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await flows());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("segments", {
        title: "Segments",
        description: "Segments.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await segments());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("disposable_check", {
        title: "Disposable check",
        description: "Would this signup address land in a throwaway inbox? Check the domain, and any related domains, against the disposable-email blocklist of more than nine thousand domains. No Klaviyo key needed.",
        inputSchema: z.object({ email: z.string().describe("Address or domain to check, e.g. throwaway@mailinator.com"), related: z.array(z.string()).describe("Other addresses or domains to check in the same call.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: disposable_check ----
        const paywallMessage = await premiumRequired("disposable_check");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await disposableCheck(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("sending_readiness", {
        title: "Sending readiness",
        description: "Is a sending domain set up to be delivered: MX exchangers, the SPF record, the DMARC record and DKIM selectors, read live from DNS, with the gaps listed. No Klaviyo key needed.",
        inputSchema: z.object({ domain: z.string().describe("Sending domain, e.g. shop.example.com"), dkim_selectors: z.array(z.string()).describe("DKIM selectors to check, e.g. ['dkim','google'].") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: sending_readiness ----
        const paywallMessage = await premiumRequired("sending_readiness");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await sendingReadiness(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
