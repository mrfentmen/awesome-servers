import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listVisitors, getProfile, getConversation, conversations, conversationMessages, conversationMeta, listOperators, listInboxes, audiencePulse } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "crisp-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_visitors", {
        title: "Visitors",
        description: "Visitors on the site right now, with last page seen.",
        inputSchema: z.object({
            website_id: z.string().describe("Website ID, e.g. 8a1b2c3d-4e5f")
        }),
        annotations: READ_ONLY,
    }, async ({ website_id }) => {
        try {
            return text(await listVisitors(website_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_profile", {
        title: "People profile",
        description: "Crisp profile for one email, with custom fields.",
        inputSchema: z.object({
            website_id: z.string().describe("Website ID, e.g. 8a1b2c3d-4e5f"),
            email: z.string().describe("Visitor email.")
        }),
        annotations: READ_ONLY,
    }, async ({ website_id, email }) => {
        try {
            return text(await getProfile(website_id, email));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_conversation", {
        title: "Conversation",
        description: "Messages in one conversation, by session id.",
        inputSchema: z.object({
            website_id: z.string().describe("Website ID, e.g. 8a1b2c3d-4e5f"),
            session_id: z.string().describe("Session ID, e.g. session_9f8c7b2a")
        }),
        annotations: READ_ONLY,
    }, async ({ website_id, session_id }) => {
        try {
            return text(await getConversation(website_id, session_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("conversations", {
        title: "Conversations",
        description: "Paged conversation list.",
        inputSchema: z.object({
            website_id: z.string().describe("Website ID."),
            page: z.string().describe("Page (default 1).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ website_id, page }) => {
        try {
            return text(await conversations(website_id, page));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("conversation_messages", {
        title: "Messages",
        description: "Messages in a session.",
        inputSchema: z.object({
            website_id: z.string().describe("Website ID."),
            session_id: z.string().describe("Session ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ website_id, session_id }) => {
        try {
            return text(await conversationMessages(website_id, session_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("conversation_meta", {
        title: "Session meta",
        description: "Session metadata.",
        inputSchema: z.object({
            website_id: z.string().describe("Website ID."),
            session_id: z.string().describe("Session ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ website_id, session_id }) => {
        try {
            return text(await conversationMeta(website_id, session_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_operators", {
        title: "List operators",
        description: "The Crisp agent roster with each member's role, current availability and two-factor status, plus pending invites. Calls out operators without 2FA, workspaces with no or several owners, and unaccepted invites, all of which are ways account access leaks.",
        inputSchema: z.object({
            website_id: z.string().describe("Crisp website identifier, from the plugin settings."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listOperators(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_inboxes", {
        title: "List inboxes",
        description: "The Crisp inbox topology in routing order, with the operators and teams attached to each one, including operators pulled in through team membership. Flags any inbox with nobody assigned, since a conversation routed there goes unanswered.",
        inputSchema: z.object({
            website_id: z.string().describe("Crisp website identifier, from the plugin settings."),
            page: z.number().int().min(1).default(1).describe("Page of inboxes, default 1"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listInboxes(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("audience_pulse", {
        title: "Audience pulse",
        description: "Two cheap aggregate calls together: how many contacts are on the people list, and how many visitors are on the site right now with how many actively browsing. Also reports whether Crisp has capped visitor sockets, which makes the counts understate real traffic and can stop chat widgets connecting.",
        inputSchema: z.object({
            website_id: z.string().describe("Crisp website identifier, from the plugin settings."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await audiencePulse(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "crisp-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    return server;
}
