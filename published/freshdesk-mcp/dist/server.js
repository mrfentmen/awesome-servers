import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listTickets, getTicket, listContacts, contactDetails, agents, companies, groups, conversations, satisfaction, canned, serviceStatus, domainCertificates } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "freshdesk-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_tickets", {
        title: "List tickets",
        description: "Most recent support tickets, with status and priority.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listTickets());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_ticket", {
        title: "Get ticket",
        description: "One ticket by id, with requester and full text.",
        inputSchema: z.object({
            ticket_id: z.string().describe("Freshdesk ticket ID, e.g. 12345")
        }),
        annotations: READ_ONLY,
    }, async ({ ticket_id }) => {
        try {
            return text(await getTicket(ticket_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_contacts", {
        title: "List contacts",
        description: "Support contacts with email and company.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listContacts());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("contact_details", {
        title: "Contact details",
        description: "Single contact.",
        inputSchema: z.object({
            contact_id: z.string().describe("Contact ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ contact_id }) => {
        try {
            return text(await contactDetails(contact_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("agents", {
        title: "Agents",
        description: "Support agents.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await agents());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("companies", {
        title: "Companies",
        description: "Customer companies.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await companies());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("groups", {
        title: "Groups",
        description: "Agent groups.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await groups());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("conversations", {
        title: "Ticket thread",
        description: "Conversation on a ticket.",
        inputSchema: z.object({
            ticket_id: z.string().describe("Ticket ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ ticket_id }) => {
        try {
            return text(await conversations(ticket_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("satisfaction", {
        title: "Satisfaction",
        description: "CSAT ratings.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await satisfaction());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("canned", {
        title: "Canned folders",
        description: "Reply templates.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await canned());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("service_status", {
        title: "Service status",
        description: "Public Statuspage report for a vendor: overall state, component statuses, open incidents and scheduled maintenance.",
        inputSchema: z.object({
            status_page: z.string().describe("Status page host, e.g. https://www.githubstatus.com"),
            limit: z.number().int().min(1).max(10).default(5).describe("How many incidents and components to print."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: service_status ----
        try {
            return text(await serviceStatus(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("domain_certificates", {
        title: "Domain certificates",
        description: "Certificate transparency records for a domain and its subdomains: issuers, names and validity windows.",
        inputSchema: z.object({
            domain: z.string().describe("Domain name, e.g. zoom.us"),
            limit: z.number().int().min(1).max(20).default(8).describe("How many certificate records to print."),
            include_expired: z.boolean().default(false).describe("Include certificates that have already expired."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: domain_certificates ----
        try {
            return text(await domainCertificates(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
