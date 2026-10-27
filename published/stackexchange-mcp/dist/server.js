import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { answerLookup, answers, questionComments, questionDetails, questionList, siteList, tagList, topUsers, userAnswers } from "./api.js";
import { search } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "stackexchange-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search questions on a site.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), site: z.string().describe("Site like stackoverflow.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("answers", {
        title: "Answers",
        description: "Answers for a question.",
        inputSchema: z.object({ questionId: z.number().describe("Question ID."), site: z.string().describe("Site like stackoverflow.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await answers(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("questions", {
        title: "Questions",
        description: "Active questions on a site.",
        inputSchema: z.object({ site: z.string().describe("Site like stackoverflow.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await questionList(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("question_details", {
        title: "Question details",
        description: "Full question with body.",
        inputSchema: z.object({ questionId: z.number().describe("Question ID."), site: z.string().describe("Site like stackoverflow.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await questionDetails(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("tags", {
        title: "Tags",
        description: "Popular tags on a site.",
        inputSchema: z.object({ site: z.string().describe("Site like stackoverflow.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await tagList(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("top_users", {
        title: "Top users",
        description: "Highest-reputation users.",
        inputSchema: z.object({ site: z.string().describe("Site like stackoverflow.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await topUsers(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("sites", {
        title: "Sites",
        description: "Stack Exchange network sites.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await siteList());
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("answer_lookup", {
        title: "Answer lookup",
        description: "One answer by ID.",
        inputSchema: z.object({ answerId: z.number().describe("Answer ID."), site: z.string().describe("Site like stackoverflow.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await answerLookup(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("question_comments", {
        title: "Question comments",
        description: "Comments on a question.",
        inputSchema: z.object({ questionId: z.number().describe("Question ID."), site: z.string().describe("Site like stackoverflow.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await questionComments(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("user_answers", {
        title: "User answers",
        description: "Top answers by a user.",
        inputSchema: z.object({ userId: z.number().describe("User ID."), site: z.string().describe("Site like stackoverflow.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await userAnswers(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
