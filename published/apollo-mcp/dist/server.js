import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { health, matchPerson, searchPeople, peopleSearch, companySearch, orgEnrich, bulkMatch, getContact, accountSearch, peopleSearchV1, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "apollo-mcp",
        version: "1.0.0",
    });
    server.registerTool("health", {
        title: "Account health",
        description: "Check that the Apollo API key still works.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await health());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("match_person", {
        title: "Enrich person",
        description: "Match one person by email, name or company.",
        inputSchema: z.object({
            email: z.string().describe("Work email, e.g. jane@acme.com").optional(),
            first_name: z.string().describe("First name, e.g. Jane").optional(),
            last_name: z.string().describe("Last name, e.g. Doe").optional(),
            organization: z.string().describe("Employer, e.g. Acme Corp").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ email, first_name, last_name, organization }) => {
        try {
            return text(await matchPerson(email, first_name, last_name, organization));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_people", {
        title: "Search people",
        description: "Prospect search by title, location and company size.",
        inputSchema: z.object({
            query: z.string().describe("Search keywords, e.g. software engineer"),
            limit: z.string().describe("Max results (default 5, max 25).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchPeople(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("people_search", {
        title: "People search v2",
        description: "Prospects by keywords.",
        inputSchema: z.object({
            query: z.string().describe("Keywords."),
            limit: z.string().describe("Max results (default 5, max 25).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await peopleSearch(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("company_search", {
        title: "Company search",
        description: "Companies by name.",
        inputSchema: z.object({
            query: z.string().describe("Company name."),
            limit: z.string().describe("Max results (default 5, max 25).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await companySearch(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("org_enrich", {
        title: "Enrich company",
        description: "Company by domain.",
        inputSchema: z.object({
            domain: z.string().describe("e.g. apollo.io.")
        }),
        annotations: READ_ONLY,
    }, async ({ domain }) => {
        try {
            return text(await orgEnrich(domain));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("bulk_match", {
        title: "Bulk enrich",
        description: "Up to 10 emails.",
        inputSchema: z.object({
            emails: z.string().describe("Comma-separated emails.")
        }),
        annotations: READ_ONLY,
    }, async ({ emails }) => {
        try {
            return text(await bulkMatch(emails));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_contact", {
        title: "Get contact",
        description: "Contact by ID.",
        inputSchema: z.object({
            contact_id: z.string().describe("Contact ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ contact_id }) => {
        try {
            return text(await getContact(contact_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("account_search", {
        title: "Account search",
        description: "Accounts by name.",
        inputSchema: z.object({
            query: z.string().describe("Company name."),
            limit: z.string().describe("Max results (default 5, max 25).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await accountSearch(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("people_search_v1", {
        title: "Search by title",
        description: "Prospects by job title.",
        inputSchema: z.object({
            titles: z.string().describe("Comma-separated titles."),
            limit: z.string().describe("Max results (default 5, max 25).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ titles, limit }) => {
        try {
            return text(await peopleSearchV1(titles, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    return server;
}
