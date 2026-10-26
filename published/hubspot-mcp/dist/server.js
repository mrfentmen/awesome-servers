import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listContacts, listCompanies, listDeals, listTickets, listOwners, getContact, getCompany, getDeal, searchContacts, dealPipelines, legalEntityLookup, secCompany } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "hubspot-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_contacts", {
        title: "List contacts",
        description: "CRM contacts with email, name and owner.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listContacts(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_companies", {
        title: "List companies",
        description: "CRM companies with domain and industry.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listCompanies(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_deals", {
        title: "List deals",
        description: "CRM deals with amount, stage and close date.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listDeals(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_tickets", {
        title: "List tickets",
        description: "Service tickets.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listTickets(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_owners", {
        title: "List owners",
        description: "Record owners.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listOwners());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_contact", {
        title: "Get contact",
        description: "Contact details.",
        inputSchema: z.object({
            contact_id: z.string().describe("Contact ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ contact_id }) => {
        try {
            return text(await getContact(contact_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_company", {
        title: "Get company",
        description: "Company details.",
        inputSchema: z.object({
            company_id: z.string().describe("Company ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ company_id }) => {
        try {
            return text(await getCompany(company_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_deal", {
        title: "Get deal",
        description: "Deal details.",
        inputSchema: z.object({
            deal_id: z.string().describe("Deal ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ deal_id }) => {
        try {
            return text(await getDeal(deal_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("search_contacts", {
        title: "Find by email",
        description: "Contact lookup.",
        inputSchema: z.object({
            email: z.string().describe("Email address.")
        }),
        annotations: READ_ONLY,
    }, async ({ email }) => {
        try {
            return text(await searchContacts(email));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("deal_pipelines", {
        title: "Deal pipelines",
        description: "Stages.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await dealPipelines());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("legal_entity_lookup", {
        title: "Legal entity lookup",
        description: "Is that company a registered legal entity, and where: LEI number and status, registered address, headquarters country and other names, from the GLEIF index. No HubSpot token needed.",
        inputSchema: z.object({ name: z.string().describe("Company name to look up, e.g. Stripe"), limit: z.number().int().min(1).max(20).default(5).describe("How many records to print (default 5, max 20).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await legalEntityLookup(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("sec_company", {
        title: "SEC company",
        description: "Is that company an SEC registrant: CIK, ticker, SIC industry code, state of incorporation, fiscal year end, former names and its latest 10-K, 10-Q, 8-K and S-1 filings with links. No HubSpot token needed.",
        inputSchema: z.object({ name: z.string().describe("Company name or ticker, e.g. Apple or AAPL"), limit: z.number().int().min(1).max(30).default(5).describe("How many filings to print (default 5, max 30).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await secCompany(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
