import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listAlerts, getAlert, listOnCalls, escalationTimeline, platformReliability, incidentResponseStats } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "opsgenie-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_alerts", {
        title: "List alerts",
        description: "Open alerts, with priority, owner and created time.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 20, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listAlerts(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_alert", {
        title: "Get alert",
        description: "One alert by id, with description and timeline.",
        inputSchema: z.object({
            alert_id: z.string().describe("Alert ID from the Opsgenie URL")
        }),
        annotations: READ_ONLY,
    }, async ({ alert_id }) => {
        try {
            return text(await getAlert(alert_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_oncalls", {
        title: "List on-calls",
        description: "Who is on call now, per rotation and schedule.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listOnCalls());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("escalation_timeline", {
        title: "Escalation timeline",
        description: "Work out who actually gets woken up by an escalation policy, computed locally: for each step and repeat, who is on shift at that moment in their own timezone, who is being paged out of hours, when the first genuinely on-shift responder is reached, and every coverage gap where a step reaches nobody who is working.",
        inputSchema: z.object({
            alert_time: z.string().describe("When the alert fires, ISO 8601, e.g. 2026-09-28T03:15:00Z."),
            steps: z.array(z.object({ after_minutes: z.number(), targets: z.array(z.string()) })).describe("The policy steps, in order."),
            responders: z.array(z.object({ name: z.string(), offset_hours: z.number(), start_hour: z.number(), end_hour: z.number() })).describe("The roster: name, UTC offset in hours, and working hours as local 0-24."),
            repeats: z.number().describe("How many times the whole policy repeats, 1-5.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await escalationTimeline(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("platform_reliability", {
        title: "Platform reliability",
        description: "How Opsgenie's own paging platform is behaving right now: the headline status, a count of every tracked component by state, anything not operational named individually, and how many components sit under each region and product area, so one red component is not mistaken for a platform-wide outage.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (_args) => {
        // ---- paywall: platform_reliability ----
        const paywallMessage = await premiumRequired("platform_reliability");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await platformReliability(_args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("incident_response_stats", {
        title: "Incident response stats",
        description: "The incident history as operational numbers rather than a list: how many incidents, by impact and by status, median, mean and longest time to resolve, how many were published with no update at all, a by-hour histogram of when incidents start, the overnight share, and the longest incidents with their closing notes.",
        inputSchema: z.object({ limit: z.number().describe("How many longest incidents to show, 1-10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: incident_response_stats ----
        const paywallMessage = await premiumRequired("incident_response_stats");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await incidentResponseStats(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
