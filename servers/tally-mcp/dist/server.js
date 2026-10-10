import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listForms, getForm, listSubmissions, listWebhooks, getWebhook, questionQualityAudit, formLogicAudit, completionEstimate } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "tally-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_forms", {
        title: "List forms",
        description: "All Tally forms, with id and title.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listForms());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_form", {
        title: "Get form",
        description: "One form's structure: blocks, fields and settings.",
        inputSchema: z.object({
            form_id: z.string().describe("Form ID from the Tally URL, e.g. aBcD12")
        }),
        annotations: READ_ONLY,
    }, async ({ form_id }) => {
        try {
            return text(await getForm(form_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_submissions", {
        title: "Submissions",
        description: "Responses submitted through this form, newest first.",
        inputSchema: z.object({
            form_id: z.string().describe("Form ID from the Tally URL, e.g. aBcD12"),
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ form_id, limit }) => {
        try {
            return text(await listSubmissions(form_id, limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_webhooks", {
        title: "List webhooks",
        description: "Form webhooks.",
        inputSchema: z.object({
            form_id: z.string().describe("Form ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ form_id }) => {
        try {
            return text(await listWebhooks(form_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_webhook", {
        title: "Get webhook",
        description: "Webhook details.",
        inputSchema: z.object({
            form_id: z.string().describe("Form ID."),
            webhook_id: z.string().describe("Webhook ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ form_id, webhook_id }) => {
        try {
            return text(await getWebhook(form_id, webhook_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("question_quality_audit", {
        title: "Question quality audit",
        description: "Audit how answerable your questions are, computed locally: labels over 90 characters that wrap into a paragraph, duplicate questions, option lists with a duplicate or with no other escape, a required share high enough to suppress completion, a sentiment question where an answer was needed, and an email question not typed as an email field. Takes a plain list of questions or a form definition as JSON.",
        inputSchema: z.object({ input: z.string().describe("Questions one per line, or a form definition as JSON with blocks, questions or pages.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await questionQualityAudit(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("form_logic_audit", {
        title: "Form logic audit",
        description: "Check a form's conditional logic as a graph, computed locally: rules pointing at a question that is not in the form, questions that reference themselves, cycles a respondent can loop through, and backward references where a question branches to one that appears earlier so the answer is not known yet.",
        inputSchema: z.object({ input: z.string().describe("A form definition as JSON whose blocks carry logic, conditions, rules or branches.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: form_logic_audit ----
        const paywallMessage = await premiumRequired("form_logic_audit");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await formLogicAudit(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("completion_estimate", {
        title: "Completion estimate",
        description: "Estimate how long your form takes and how many visits you need for a target number of responses at a given confidence, computed locally from explicit per-question-type time constants, with the constants printed so you can argue with them, the questions that dominate the time, and the effect of the required share on the completion rate.",
        inputSchema: z.object({
            input: z.string().describe("Questions one per line, or a form definition as JSON."),
            target_responses: z.number().describe("Responses you want completed.").optional(),
            confidence_pct: z.number().describe("Two-sided confidence, 50-99.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: completion_estimate ----
        const paywallMessage = await premiumRequired("completion_estimate");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await completionEstimate(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
