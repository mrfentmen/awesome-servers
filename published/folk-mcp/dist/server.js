import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listPeople, getPerson, listGroups, emailDomainDns, domainRegistration } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "folk-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_people", {
        title: "List people",
        description: "Contacts in the Folk workspace, newest first.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 20, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listPeople(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_person", {
        title: "Get person",
        description: "One contact by id, with emails and company.",
        inputSchema: z.object({
            person_id: z.string().describe("Folk person ID, e.g. p_1234")
        }),
        annotations: READ_ONLY,
    }, async ({ person_id }) => {
        try {
            return text(await getPerson(person_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_groups", {
        title: "List groups",
        description: "Contact groups with id and name.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listGroups());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("email_domain_dns", {
        title: "Email domain DNS",
        description: "Mail and web DNS for the domain of a contact's email address: MX exchangers, SPF, DMARC, AAAA and nameservers.",
        inputSchema: z.object({
            email: z.string().describe("The contact's email address, e.g. jane@acme.com"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await emailDomainDns(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("domain_registration", {
        title: "Domain registration",
        description: "RDAP registration record for a domain: registrar, registered and expiry dates, status flags and nameservers.",
        inputSchema: z.object({
            domain: z.string().describe("Domain name, e.g. acme.com"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await domainRegistration(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "folk-mcp";
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
