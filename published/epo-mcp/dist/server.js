import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, family, publicationRecord, legalStatus, epoRegister } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "epo-mcp",
        version: "1.0.0",
    });
    server.registerTool("search", {
        title: "Patent search",
        description: "Published applications by query.",
        inputSchema: z.object({
            query: z.string().describe("CQL query, e.g. ti=tesla."),
            range: z.string().describe("Result range (default 1-10).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, range }) => {
        try {
            return text(await search(query, range));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("family", {
        title: "Patent family",
        description: "Family for a publication number.",
        inputSchema: z.object({
            country: z.string().describe("Country code, e.g. EP"),
            number: z.string().describe("Publication number."),
            kind: z.string().describe("Kind code, e.g. A1.")
        }),
        annotations: READ_ONLY,
    }, async ({ country, number, kind }) => {
        try {
            return text(await family(country, number, kind));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("publication_record", {
        title: "Full publication record",
        description: "Retrieves the full OPS publication document for one patent number: title, applicants, inventors, priority claims, application and filing dates, and the IPC and CPC classification symbols with their sense. The existing search tool only returns a bibliographic hit list, so this is the step that shows what the patent is actually about, and it reports honestly whether claims and description text were included in the response.",
        inputSchema: z.object({
            country: z.string().describe("Two-letter country code, e.g. EP, WO, US, JP."),
            number: z.string().describe("Publication number, digits only, e.g. 1000000."),
            kind: z.string().describe("Kind code, e.g. A1, B2, A or B2."),
            include_abstract: z.boolean().default(true).describe("Include the abstract text. Default true"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await publicationRecord(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("legal_status", {
        title: "INPADOC legal status",
        description: "Lists the INPADOC legal events for a publication with the common event codes decoded, which is what tells you whether a right was granted, withdrawn, opposed or ceased. States a conclusion only when the events support it outright and leaves anything ambiguous as a question, because a wrong claim that a patent is in force is the costly error. Ends with the explicit caveat that INPADOC lags the official registers.",
        inputSchema: z.object({
            country: z.string().describe("Two-letter country code, e.g. EP, WO, US, JP."),
            number: z.string().describe("Publication number, digits only."),
            kind: z.string().describe("Kind code, e.g. A1 or B2."),
            limit: z.number().int().min(1).max(200).default(40).describe("Events to list, default 40"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await legalStatus(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("epo_register", {
        title: "EPO Register record",
        description: "Reads the EPO Register entry for a European application: applicant, inventors, appointed representative, priority claims, and the numbered procedure history showing filing, withdrawal, publication, examination request, communications, opposition and grant in order. The register is the authoritative European record and unlike the INPADOC list it carries the prosecution history and the representative, and it covers European filings only.",
        inputSchema: z.object({
            epodoc: z.string().describe("EP application number, e.g. EP1234567 or 1234567."),
            limit: z.number().int().min(1).max(200).default(30).describe("Procedure steps to list, default 30"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await epoRegister(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "epo-mcp";
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
