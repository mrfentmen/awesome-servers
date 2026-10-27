import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { categoryCounts, errorMessage, formatQuiz, globalCounts, listCategories, questions, sessionToken, compareCategories, quizReadiness, categoryQuality, questionFairnessAudit, distractorQuality, quizExploitability } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const CATEGORY = z.string().describe("Numeric category id from list_categories, e.g. '17' for Science").optional();
const DIFFICULTY = z.enum(["easy", "medium", "hard"]).describe("Question difficulty").optional();
const TOKEN = z.string().describe("Optional session token from session_token: stops repeats").optional();
export function createServer() {
    const server = new McpServer({
        name: "opentdb-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_categories", {
        title: "List categories",
        description: "Every trivia category with the numeric id used by the other tools.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const { trivia_categories } = await listCategories();
            const lines = trivia_categories.map((c) => `  ${String(c.id).padStart(3)}  ${c.name}`);
            return text(`${trivia_categories.length} categories:\n\n${lines.join("\n")}`);
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("category_counts", {
        title: "Category question counts",
        description: "How many questions a category holds, split by difficulty. Useful before requesting a quiz.",
        inputSchema: z.object({ category: z.string().describe("Numeric category id, e.g. '17'") }),
        annotations: READ_ONLY,
    }, async ({ category }) => {
        try {
            const data = await categoryCounts(category);
            const c = data.category_question_count;
            return text([
                `Category ${data.category_id}: ${c.total_question_count} questions`,
                `  easy    ${c.total_easy_question_count}`,
                `  medium  ${c.total_medium_question_count}`,
                `  hard    ${c.total_hard_question_count}`,
            ].join("\n"));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("global_counts", {
        title: "Database totals",
        description: "How many questions the whole trivia database holds, overall and per category name.",
        inputSchema: z.object({
            top: z.number().int().min(1).max(50).default(10).describe("Show the N largest categories"),
        }),
        annotations: READ_ONLY,
    }, async ({ top }) => {
        try {
            const data = await globalCounts();
            const rows = Object.entries(data.categories)
                .map(([name, v]) => ({ name, n: v?.total_num_of_questions ?? 0 }))
                .sort((a, b) => b.n - a.n);
            const o = data.overall;
            return text([
                "Open Trivia DB totals",
                "",
                `  verified questions  ${o.total_num_of_verified_questions}`,
                `  pending            ${o.total_num_of_pending_questions}`,
                `  rejected           ${o.total_num_of_rejected_questions}`,
                `  categories         ${rows.length}`,
                "",
                "Largest categories:",
                ...rows.slice(0, top).map((r) => `  ${r.name.padEnd(34)} ${r.n}`),
            ].join("\n"));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_questions", {
        title: "Get raw questions",
        description: "Fetch trivia questions with their answers as structured data, for your own formatting.",
        inputSchema: z.object({
            amount: z.number().int().min(1).max(50).default(5).describe("How many questions"),
            category: CATEGORY,
            difficulty: DIFFICULTY,
            token: TOKEN,
        }),
        annotations: READ_ONLY,
    }, async ({ amount, category, difficulty, token }) => {
        try {
            const list = await questions(amount, category, difficulty, token);
            return text(JSON.stringify(list, null, 2));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("quiz", {
        title: "Build a quiz",
        description: "A ready-to-read quiz: numbered questions with options and an answer key at the end. Filter by category and difficulty.",
        inputSchema: z.object({
            amount: z.number().int().min(1).max(50).default(5).describe("How many questions"),
            category: CATEGORY,
            difficulty: DIFFICULTY,
            token: TOKEN,
        }),
        annotations: READ_ONLY,
    }, async ({ amount, category, difficulty, token }) => {
        try {
            const list = await questions(amount, category, difficulty, token);
            const label = [category ? `category ${category}` : "any category", difficulty ?? "any difficulty"].join(", ");
            return text(formatQuiz(list, `Quiz (${label})`));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("session_token", {
        title: "Session token",
        description: "Get or reset a session token. Pass it to quiz or get_questions so the same question is never served twice.",
        inputSchema: z.object({
            action: z.enum(["request", "reset"]).default("request").describe("request a new token, or reset an exhausted one"),
        }),
        annotations: READ_ONLY,
    }, async ({ action }) => {
        try {
            const token = await sessionToken(action);
            return text(`${action === "request" ? "New" : "Reset"} session token:\n\n  ${token}\n\nPass it as the token argument to quiz or get_questions.`);
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("compare_categories", {
        title: "Compare categories",
        description: "Put two categories side by side: total questions, the easy/medium/hard split with shares, and which of the pair is deeper in hard questions.",
        inputSchema: z.object({
            a: z.string().describe("First category id from list_categories, e.g. '17' for Science & Nature"),
            b: z.string().describe("Second category id, e.g. '9' for General Knowledge"),
        }),
        annotations: READ_ONLY,
    }, async ({ a, b }) => {
        try {
            return text(await compareCategories({ a, b }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("quiz_readiness", {
        title: "Quiz readiness",
        description: "Pre-flight a planned quiz: does this category hold enough questions at that difficulty for the amount asked, and what is the largest amount it can serve if not.",
        inputSchema: z.object({
            category: z.string().describe("Category id from list_categories, e.g. '17'"),
            difficulty: z.enum(["easy", "medium", "hard"]).describe("Difficulty to serve"),
            amount: z.number().describe("Questions you plan to request, 1-50 per call"),
        }),
        annotations: READ_ONLY,
    }, async ({ category, difficulty, amount }) => {
        try {
            return text(await quizReadiness({ category, difficulty, amount }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("category_quality", {
        title: "Category quality",
        description: "Rank categories by their share of human-verified questions and show pending and rejected counts, so a quiz is not built from a poorly reviewed category.",
        inputSchema: z.object({
            limit: z.number().describe("How many categories to show, 1-30. Defaults to 10.").optional(),
            minTotal: z.number().describe("Ignore categories with fewer than this many questions. Defaults to 50.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ limit, minTotal }) => {
        try {
            return text(await categoryQuality({ limit, minTotal }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("question_fairness_audit", {
        title: "Question fairness audit",
        description: "Judge whether a batch of opentdb questions is fair to ask, from the wording and answer shape alone: how many are worded as negatives, how many say which or all of the following, how many are compound against four or more options, how long the questions run, how many leak the answer through author or director wording, how many still carry HTML entities after decoding, and questions with too few distractors, duplicated answers or a distractor within two per cent of a numeric answer.",
        inputSchema: z.object({
            amount: z.number().describe("How many questions to pull, 1-50.").optional(),
            category: z.number().describe("OpenTDB category id to restrict to.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await questionFairnessAudit(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("distractor_quality", {
        title: "Distractor quality",
        description: "How well formed the answer sets are: how many wrong answers each question offers, the length band of the correct answer, how often the correct answer is the longest option (the heuristic quiz apps exploit), how many numeric questions have a distractor within five per cent, and the answer sets with a near-length match or a repeated value, with the questions that caused them.",
        inputSchema: z.object({
            amount: z.number().describe("How many questions to pull, 5-50.").optional(),
            category: z.number().describe("OpenTDB category id to restrict to.").optional(),
            difficulty: z.string().describe("easy, medium or hard.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await distractorQuality(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("quiz_exploitability", {
        title: "Quiz exploitability",
        description: "Whether a quiz built from this pool can be passed without knowing anything: mean correct-answer length against mean distractor length, the median correct-answer length, what always-pick-the-longest and always-pick-the-shortest actually score against a random baseline, and how many longest options tie the right answer. Reports no positional statistic, because the API never exposes which slot held the right answer.",
        inputSchema: z.object({
            batches: z.number().describe("How many batches to pull, 1-4. Each costs a five second wait.").optional(),
            amount: z.number().describe("Questions per batch, 10-50.").optional(),
            category: z.number().describe("OpenTDB category id to restrict to.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await quizExploitability(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
