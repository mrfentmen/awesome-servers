import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, search, listUsers, getPage, queryDatabase, blockChildren, searchDatabases, getUser, appendBlock, updatePageTitle, createPage, notionPageMetadata, notionIdAudit } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const MUTATING = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "notion-mcp",
        version: "1.0.0",
    });
    server.registerTool("search", {
        title: "Search",
        description: "Pages and databases the integration can reach, by title.",
        inputSchema: z.object({
            query: z.string().describe("Search text.")
        }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            return text(await search(query));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_users", {
        title: "List users",
        description: "Users in the Notion workspace, with id, name and type.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listUsers());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_page", {
        title: "Get page",
        description: "Properties of one page, by the page id.",
        inputSchema: z.object({
            page_id: z.string().describe("Page ID, e.g. 8a1b2c3d4e5f67890a1b2c3d4e5f6789")
        }),
        annotations: READ_ONLY,
    }, async ({ page_id }) => {
        try {
            return text(await getPage(page_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("query_database", {
        title: "Query database",
        description: "Rows of a database.",
        inputSchema: z.object({
            database_id: z.string().describe("Database UUID.")
        }),
        annotations: READ_ONLY,
    }, async ({ database_id }) => {
        try {
            return text(await queryDatabase(database_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("block_children", {
        title: "Block contents",
        description: "Children blocks.",
        inputSchema: z.object({
            block_id: z.string().describe("Block UUID.")
        }),
        annotations: READ_ONLY,
    }, async ({ block_id }) => {
        try {
            return text(await blockChildren(block_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("search_databases", {
        title: "Find databases",
        description: "Databases by query.",
        inputSchema: z.object({
            query: z.string().describe("Search text.")
        }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            return text(await searchDatabases(query));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_user", {
        title: "Get user",
        description: "User details.",
        inputSchema: z.object({
            user_id: z.string().describe("User UUID.")
        }),
        annotations: READ_ONLY,
    }, async ({ user_id }) => {
        try {
            return text(await getUser(user_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("append_block", {
        title: "Append paragraph",
        description: "Add a REAL paragraph.",
        inputSchema: z.object({
            block_id: z.string().describe("Parent block UUID."),
            paragraph: z.string().describe("Text.")
        }),
        annotations: MUTATING,
    }, async ({ block_id, paragraph }) => {
        try {
            return text(await appendBlock(block_id, paragraph));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("update_page_title", {
        title: "Retitle page",
        description: "Set a REAL title.",
        inputSchema: z.object({
            page_id: z.string().describe("Page UUID."),
            title: z.string().describe("New title.")
        }),
        annotations: MUTATING,
    }, async ({ page_id, title }) => {
        try {
            return text(await updatePageTitle(page_id, title));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("create_page", {
        title: "Create page",
        description: "Create a REAL subpage.",
        inputSchema: z.object({
            parent_page_id: z.string().describe("Parent UUID."),
            title: z.string().describe("Title.")
        }),
        annotations: MUTATING,
    }, async ({ parent_page_id, title }) => {
        try {
            return text(await createPage(parent_page_id, title));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("notion_page_metadata", {
        title: "Notion page metadata",
        description: "What a public Notion page publishes about itself, with no token: final URL after redirects, HTTP status, og title, description, social image, canonical link, robots directive and any page id visible in the response, plus whether the document actually loaded or only returned an error marker.",
        inputSchema: z.object({ url: z.string().describe("Public Notion page URL, e.g. https://www.notion.so/workspace/Page-Title-83715d7703ee4b8699b4ba7b334859b6.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: notion_page_metadata ----
        const paywallMessage = await premiumRequired("notion_page_metadata");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await notionPageMetadata(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("notion_id_audit", {
        title: "Notion id audit",
        description: "Check up to twenty Notion ids or Notion URLs before spending an API call on them: which are well-formed UUIDs (and which UUID version), which are 32-hex that Notion accepts, which page slug each URL carries, and which carry no id at all.",
        inputSchema: z.object({ ids: z.string().describe("Notion ids or URLs, separated by spaces or commas.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: notion_id_audit ----
        const paywallMessage = await premiumRequired("notion_id_audit");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await notionIdAudit(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
