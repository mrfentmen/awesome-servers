/**
 * Open Trivia DB client, keyless.
 * Public trivia API; session tokens stop the same question repeating.
 */
export class TriviaError extends Error {
    constructor(message) {
        super(message);
        this.name = "TriviaError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = "mrfentmen-opentdb-mcp/1.0";
const BASE = "https://opentdb.com";
export const DIFFICULTIES = ["easy", "medium", "hard"];
const RESPONSE_CODES = {
    0: "Success",
    1: "No results - not enough questions for that combination, try a lower amount.",
    2: "Invalid parameter - check the category id and difficulty.",
    3: "Session token not found - request a new one.",
    4: "Session token exhausted - reset it or request a new one.",
    5: "Rate limited - wait a moment and retry.",
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function get(path, attempt = 0) {
    let res;
    try {
        res = await fetch(BASE + path, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(20000),
        });
    }
    catch (e) {
        throw new TriviaError(`Could not reach opentdb.com: ${errorMessage(e)}`);
    }
    if (res.status === 429) {
        // opentdb allows one request every 5 seconds; wait it out once before giving up.
        if (attempt === 0) {
            await sleep(5200);
            return get(path, 1);
        }
        throw new TriviaError("Open Trivia DB is rate limiting (one request every 5 seconds). Retry in a moment.");
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 200);
        throw new TriviaError(`opentdb.com returned HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
function envelope(path, raw) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        throw new TriviaError("opentdb.com returned a non-JSON response.");
    }
    if (typeof parsed.response_code === "number" && parsed.response_code !== 0) {
        throw new TriviaError(RESPONSE_CODES[parsed.response_code] ?? `opentdb error ${parsed.response_code}.`);
    }
    if (parsed.results === undefined)
        throw new TriviaError(`No results returned for ${path}.`);
    return parsed.results;
}
/** opentdb HTML-escapes question text and answers. */
export function decode(raw) {
    return raw
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&lsquo;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&eacute;/g, "é")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}
export async function listCategories() {
    return JSON.parse(await get("/api_category.php"));
}
export async function categoryCounts(category) {
    const id = categoryId(category);
    return JSON.parse(await get(`/api_count.php?category=${id}`));
}
export async function globalCounts() {
    return JSON.parse(await get("/api_count_global.php"));
}
function params(amount, category, difficulty, token, type) {
    const q = new URLSearchParams({ amount: String(amount) });
    if (category && category.trim())
        q.set("category", categoryId(category));
    if (difficulty && difficulty.trim()) {
        const d = difficulty.trim().toLowerCase();
        if (!DIFFICULTIES.includes(d)) {
            throw new TriviaError(`Difficulty must be easy, medium or hard - got "${difficulty}".`);
        }
        q.set("difficulty", d);
    }
    if (type && type.trim())
        q.set("type", type.trim());
    if (token && token.trim())
        q.set("token", token.trim());
    return q.toString();
}
function categoryId(category) {
    const c = category.trim();
    if (!/^\d+$/.test(c)) {
        throw new TriviaError(`"${category}" is not a numeric category id - call list_categories for the ids.`);
    }
    return c;
}
export async function questions(amount, category, difficulty, token, type) {
    const size = Math.min(Math.max(Math.round(amount) || 5, 1), 50);
    const path = `/api.php?${params(size, category, difficulty, token, type)}`;
    return envelope(path, await get(path));
}
export async function sessionToken(action) {
    const raw = await get(`/api_token.php?command=${action}`);
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        throw new TriviaError("opentdb.com returned a non-JSON token response.");
    }
    if (parsed.response_code !== 0 || !parsed.token) {
        throw new TriviaError(RESPONSE_CODES[parsed.response_code] ?? "Could not get a session token.");
    }
    return parsed.token;
}
export function formatQuestion(q, index) {
    const answers = [q.correct_answer, ...q.incorrect_answers].map(decode);
    const shown = answers.map((a) => `     - ${a}`).join("\n");
    return [
        `${index + 1}. ${decode(q.question)}`,
        `   [${q.difficulty} · ${q.category} · ${q.type === "boolean" ? "true/false" : "multiple choice"}]`,
        shown,
    ].join("\n");
}
export function formatQuiz(list, title) {
    if (list.length === 0)
        return `No questions available for ${title}.`;
    const questions = list.map((q, i) => formatQuestion(q, i));
    const key = list.map((q, i) => `  ${i + 1}. ${decode(q.correct_answer)}`);
    return [
        `${title} - ${list.length} question(s)`,
        "",
        questions.join("\n\n"),
        "",
        "Answer key:",
        key.join("\n"),
    ].join("\n");
}
/** The category list changes about once a year, and every count call is rate limited. */
let categoryCache = null;
async function categoryNames() {
    if (!categoryCache)
        categoryCache = (await listCategories()).trivia_categories;
    return categoryCache;
}
function nameOf(categories, id) {
    return categories.find((c) => c.id === id)?.name ?? `category ${id}`;
}
const share = (part, whole) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%");
const difficultyRow = (counts) => [
    `easy ${counts.total_easy_question_count.toLocaleString()} (${share(counts.total_easy_question_count, counts.total_question_count)})`,
    `medium ${counts.total_medium_question_count.toLocaleString()} (${share(counts.total_medium_question_count, counts.total_question_count)})`,
    `hard ${counts.total_hard_question_count.toLocaleString()} (${share(counts.total_hard_question_count, counts.total_question_count)})`,
].join(", ");
/** Two categories side by side, so a quiz can be built from the easier or harder of the pair. */
export async function compareCategories(args) {
    const first = await categoryCounts(args.a);
    const second = await categoryCounts(args.b);
    const categories = await categoryNames();
    const a = first.category_question_count;
    const b = second.category_question_count;
    const hardWinner = a.total_hard_question_count === b.total_hard_question_count
        ? "both hold the same number of hard questions"
        : `hard questions favour ${nameOf(categories, a.total_hard_question_count > b.total_hard_question_count ? first.category_id : second.category_id)}`;
    return [
        "Category difficulty compare",
        `  ${nameOf(categories, first.category_id)} (id ${first.category_id}): ${a.total_question_count.toLocaleString()} questions`,
        `    ${difficultyRow(a)}`,
        `  ${nameOf(categories, second.category_id)} (id ${second.category_id}): ${b.total_question_count.toLocaleString()} questions`,
        `    ${difficultyRow(b)}`,
        "",
        `Totals differ by ${Math.abs(a.total_question_count - b.total_question_count).toLocaleString()} (${nameOf(categories, a.total_question_count >= b.total_question_count ? first.category_id : second.category_id)} is larger); ${hardWinner}.`,
        `Open Trivia DB serves at most 50 questions per request, so a ${Math.min(a.total_question_count, b.total_question_count).toLocaleString()}-question category is plenty.`,
    ].join("\n");
}
/**
 * Whether a planned quiz can actually be served. Open Trivia DB answers a
 * request larger than the pool with response code 1 and no questions at all,
 * which is the failure this check exists to prevent.
 */
export async function quizReadiness(args) {
    const wanted = (args.difficulty ?? "").trim().toLowerCase();
    if (!DIFFICULTIES.includes(wanted)) {
        throw new TriviaError(`Difficulty must be one of ${DIFFICULTIES.join(", ")}.`);
    }
    const amount = Math.trunc(args.amount ?? 0);
    if (!Number.isFinite(amount) || amount < 1)
        throw new TriviaError("Ask for at least one question.");
    const counts = await categoryCounts(args.category);
    const categories = await categoryNames();
    const c = counts.category_question_count;
    const available = wanted === "easy" ? c.total_easy_question_count : wanted === "medium" ? c.total_medium_question_count : c.total_hard_question_count;
    const best = DIFFICULTIES.map((d) => ({
        difficulty: d,
        count: d === "easy" ? c.total_easy_question_count : d === "medium" ? c.total_medium_question_count : c.total_hard_question_count,
    })).sort((x, y) => y.count - x.count)[0];
    const capped = amount > 50;
    const fits = amount <= available && !capped;
    return [
        `Quiz readiness: ${nameOf(categories, counts.category_id)} (id ${counts.category_id}), ${amount} ${wanted} question(s)`,
        fits
            ? `READY — ${available.toLocaleString()} ${wanted} questions exist, so ${amount} will be served (${available - amount} spare).`
            : `NOT READY — only ${available.toLocaleString()} ${wanted} questions exist in this category.`,
        "",
        `easy ${c.total_easy_question_count.toLocaleString()} | medium ${c.total_medium_question_count.toLocaleString()} | hard ${c.total_hard_question_count.toLocaleString()} | total ${c.total_question_count.toLocaleString()}`,
        capped ? `Open Trivia DB caps one request at 50 questions; ask ${amount} across separate calls instead.` : "",
        !fits
            ? `Ask for at most ${Math.min(available, 50)} ${wanted} question(s), or switch to ${best.difficulty} where ${best.count.toLocaleString()} exist.`
            : "",
        `A ${wanted}-only quiz uses ${share(available, c.total_question_count)} of this category's pool.`,
    ].filter((line) => line !== "").join("\n");
}
/**
 * How well moderated each category is: verified questions are checked by a
 * human, pending and rejected ones are not, and a quiz drawn from a mostly
 * unverified category will contain mistakes.
 */
export async function categoryQuality(args) {
    const limit = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 30);
    const minTotal = Math.min(Math.max(Math.trunc(args.minTotal ?? 50), 1), 100000);
    const raw = await get("/api_count_global.php");
    let envelope;
    try {
        envelope = JSON.parse(raw);
    }
    catch {
        throw new TriviaError("opentdb.com returned a non-JSON response for the global counts.");
    }
    const categories = await categoryNames();
    const rows = Object.entries(envelope.categories ?? {})
        .map(([id, counts]) => ({
        id: Number(id),
        total: counts.total_num_of_questions,
        verified: counts.total_num_of_verified_questions,
        pending: counts.total_num_of_pending_questions,
        rejected: counts.total_num_of_rejected_questions,
    }))
        .filter((row) => row.total >= minTotal)
        .map((row) => ({ ...row, verifiedShare: row.total > 0 ? row.verified / row.total : 0 }))
        .sort((a, b) => b.verifiedShare - a.verifiedShare || b.total - a.total);
    if (!rows.length)
        throw new TriviaError(`No category has ${minTotal} questions yet.`);
    const worst = rows[rows.length - 1];
    return [
        `Category quality by verified share (${rows.length} categor${rows.length === 1 ? "y" : "ies"} with ${minTotal}+ questions)`,
        `Fleet wide: ${envelope.overall.total_num_of_verified_questions.toLocaleString()} verified, ${envelope.overall.total_num_of_pending_questions.toLocaleString()} pending, ${envelope.overall.total_num_of_rejected_questions.toLocaleString()} rejected`,
        "",
        ...rows.slice(0, limit).map((row) => `  ${share(row.verified, row.total).padStart(4)} verified  ${nameOf(categories, row.id)} (id ${row.id}) — ${row.total.toLocaleString()} questions, ${row.pending.toLocaleString()} pending, ${row.rejected.toLocaleString()} rejected`),
        "",
        rows.length > limit ? `Weakest of those checked: ${nameOf(categories, worst.id)} at ${share(worst.verified, worst.total)} verified.` : "",
        `Verified share is this API's only quality signal and it changes as reviewers work, so check it before a big quiz run.`,
    ].filter((line) => line !== "").join("\n");
}
// ---- muxG tools:
const OT_LIST_CAP = 10;
/** One batch, reusing the file's own rate-limit-aware fetch. */
async function otBatch(path) {
    const raw = await get(path);
    const parsed = JSON.parse(raw);
    if (parsed.response_code !== 0 || !parsed.results) {
        return { code: parsed.response_code, questions: [], requested: Number(/amount=(\d+)/.exec(path)?.[1] ?? 0) };
    }
    return { code: 0, questions: parsed.results, requested: Number(/amount=(\d+)/.exec(path)?.[1] ?? parsed.results.length) };
}
async function otSample(amount, category, difficulty) {
    const capped = Math.max(1, Math.min(50, Math.floor(amount)));
    let qs = `/api.php?amount=${capped}`;
    if (category !== undefined)
        qs += `&category=${category}`;
    if (difficulty)
        qs += `&difficulty=${encodeURIComponent(difficulty)}`;
    const b = await otBatch(qs);
    if (b.code !== 0) {
        throw new TriviaError(b.code === 1
            ? `Not enough questions for that filter, so opentdb returned none instead of ${capped}. Lower the amount or drop the difficulty.`
            : `opentdb response code ${b.code} for that filter.`);
    }
    return b;
}
function otNumberish(s) {
    const cleaned = s.replace(/[$,%\s]/g, "");
    const m = /^-?\d+(\.\d+)?$/.exec(cleaned);
    if (!m)
        return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
}
/** Is each question actually fair to ask, judged from the wording and the answer set. */
export async function questionFairnessAudit(args) {
    const batch = await otSample(Math.max(1, Math.min(50, Math.floor(Number(args?.amount ?? 20)) || 20)), args?.category);
    const qs = batch.questions;
    if (!qs.length)
        throw new TriviaError("No questions were returned to audit.");
    let negated = 0;
    let ofTheFollowing = 0;
    let bothIn = 0;
    let long = 0;
    let entityLeak = 0;
    let undecodable = 0;
    let dupAnswers = 0;
    let tooFewDistractors = 0;
    let numericClash = 0;
    const lengths = [];
    const examples = [];
    for (const q of qs) {
        const text = decode(q.question ?? "");
        const correct = decode(q.correct_answer ?? "");
        const wrong = (q.incorrect_answers ?? []).map(decode);
        lengths.push(text.length);
        if (/\b(not|never|except|false|isn't|aren't)\b/i.test(text)) {
            negated += 1;
            if (examples.length < OT_LIST_CAP)
                examples.push(`negation: "${text.slice(0, 90)}"`);
        }
        if (/which of the following|all of the following|none of the following/i.test(text)) {
            ofTheFollowing += 1;
            if (examples.length < OT_LIST_CAP)
                examples.push(`"which of the following": "${text.slice(0, 90)}"`);
        }
        if (/\bboth\b|\ball\b/i.test(text) && wrong.length >= 3) {
            bothIn += 1;
            if (examples.length < OT_LIST_CAP)
                examples.push(`compound ("all"/"both") with ${wrong.length + 1} options: "${text.slice(0, 90)}"`);
        }
        if (text.length > 140) {
            long += 1;
            if (examples.length < OT_LIST_CAP)
                examples.push(`${text.length} characters, awkward on a phone: "${text.slice(0, 70)}..."`);
        }
        if (/&(amp|quot|#0?39|lt|gt|ldquo|rdquo|eacute);/i.test(q.question ?? "") || /&(amp|quot|#0?39|lt|gt);/i.test(q.correct_answer ?? "")) {
            undecodable += 1;
        }
        if (q.type === "boolean" && !/^(true|false)$/i.test(correct)) {
            if (examples.length < OT_LIST_CAP)
                examples.push(`true/false question whose stored answer is "${correct}": "${text.slice(0, 70)}"`);
        }
        const all = [correct, ...wrong].map((a) => a.trim().toLowerCase());
        if (new Set(all).size !== all.length) {
            dupAnswers += 1;
            if (examples.length < OT_LIST_CAP)
                examples.push(`duplicate answer text in one question: "${text.slice(0, 70)}"`);
        }
        if (q.type !== "boolean" && wrong.length < 2) {
            tooFewDistractors += 1;
        }
        const cn = otNumberish(correct);
        if (cn !== null) {
            const wrongNums = wrong.map(otNumberish).filter((n) => n !== null);
            if (wrongNums.some((n) => n !== 0 && Math.abs(n - cn) / Math.max(1, Math.abs(cn)) < 0.02)) {
                numericClash += 1;
                if (examples.length < OT_LIST_CAP)
                    examples.push(`numeric distractor within 2% of the correct answer ${correct}: "${text.slice(0, 70)}"`);
            }
        }
        if (/\b(also known as|starred|directed by|written by|born in|located in)\b/i.test(text))
            entityLeak += 1;
    }
    const sorted = [...lengths].sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
    const lines = [
        `Question fairness audit over ${qs.length} question(s) from opentdb${args?.category !== undefined ? `, category ${args.category}` : ", all categories"}`,
        `Question length: shortest ${sorted[0] ?? 0}, median ${median}, longest ${sorted[sorted.length - 1] ?? 0} characters`,
        "",
        "Flags:",
        `  worded as a negative ("not", "never", "except"): ${negated} (${((negated / qs.length) * 100).toFixed(0)}%)`,
        `  "which/all/none of the following": ${ofTheFollowing} (${((ofTheFollowing / qs.length) * 100).toFixed(0)}%)`,
        `  compound "all"/"both" against 4+ options: ${bothIn}`,
        `  longer than 140 characters: ${long}`,
        `  named entities hinted at in the wording (author, director, star): ${entityLeak}`,
        `  still carrying HTML entities after decoding: ${undecodable}`,
        `  multiple-choice with fewer than 3 distractors: ${tooFewDistractors}`,
        `  duplicate answer text within one question: ${dupAnswers}`,
        `  numeric distractor within 2% of the correct answer: ${numericClash}`,
        "",
        examples.length ? "Examples:" : "No examples to show: nothing was flagged.",
        ...examples.map((e) => `  - ${e}`),
    ];
    lines.push("", "A negative or compound question is not broken, it is just a different skill: the reader has to hold the question in mind while checking every option, and a surprising share of players answer it correctly by pattern rather than knowledge.", "Distractors within a couple of per cent of the right answer turn a knowledge question into a rounding-convention question, which is usually not what the category implies.", "This looks only at wording and answer shape, because that is all the API exposes. It cannot tell you whether an answer is factually right, and it has no way of knowing whether a given fact is common knowledge, which is the actual standard for a good trivia question.");
    return lines.join("\n");
}
/**
 * Whether a quiz built from this pool can be beaten without knowing anything.
 * The API never returns which slot holds the right answer, so no positional
 * statistic is reported here; what it does expose is enough to measure the
 * strategy a player can actually adopt: pick the longest option.
 */
export async function quizExploitability(args) {
    const batches = Math.max(1, Math.min(4, Math.floor(Number(args?.batches ?? 3)) || 3));
    const amount = Math.max(10, Math.min(50, Math.floor(Number(args?.amount ?? 50)) || 50));
    const all = [];
    const seen = new Set();
    let shortfalls = 0;
    for (let b = 0; b < batches; b += 1) {
        if (b > 0)
            await sleep(5200);
        const batch = await otSample(amount, args?.category);
        if (batch.questions.length < amount)
            shortfalls += 1;
        for (const q of batch.questions) {
            const key = decode(q.question ?? "").slice(0, 120);
            if (seen.has(key))
                continue;
            seen.add(key);
            all.push(q);
        }
    }
    if (all.length < 10)
        throw new TriviaError(`Only ${all.length} unique question(s) came back, too few to measure anything.`);
    let multi = 0;
    let longest = 0;
    let shortest = 0;
    let tied = 0;
    let correctChars = 0;
    let distractorChars = 0;
    let correctCount = 0;
    let distractorCount = 0;
    const lengths = [];
    for (const q of all) {
        if (q.type === "boolean")
            continue;
        const correct = decode(q.correct_answer ?? "").trim();
        const wrong = (q.incorrect_answers ?? []).map((a) => decode(a).trim());
        if (!correct || wrong.length < 1)
            continue;
        multi += 1;
        correctChars += correct.length;
        correctCount += 1;
        for (const w of wrong) {
            distractorChars += w.length;
            distractorCount += 1;
        }
        lengths.push(correct.length);
        const cl = correct.length;
        const maxWrong = Math.max(...wrong.map((w) => w.length));
        const minWrong = Math.min(...wrong.map((w) => w.length));
        if (cl > maxWrong)
            longest += 1;
        else if (cl < minWrong)
            shortest += 1;
        else if (cl === maxWrong)
            tied += 1;
    }
    if (multi < 5)
        throw new TriviaError(`Only ${multi} multiple-choice question(s) in ${all.length}; too few to compare strategies.`);
    const meanCorrect = correctChars / Math.max(1, correctCount);
    const meanWrong = distractorChars / Math.max(1, distractorCount);
    const sorted = [...lengths].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const alwaysLongest = longest / multi;
    const alwaysShortest = shortest / multi;
    const random = 1 / 4;
    return [
        `Quiz exploitability over ${all.length} unique question(s) in ${batches} batch(es) of up to ${amount}; ${multi} of them multiple choice`,
        shortfalls ? `${shortfalls} batch(es) came back short of ${amount}, which the API does when a filter is close to exhausted` : "Every batch returned the full amount requested",
        "",
        "Correct answer length: mean " + meanCorrect.toFixed(1) + " characters, median " + median,
        "Distractor length: mean " + meanWrong.toFixed(1) + " characters",
        meanCorrect > meanWrong
            ? "The right answer is longer than a wrong one on average, so length is a usable signal in this pool."
            : "The right answer is not longer than a wrong one on average, so length carries almost no signal here.",
        "",
        "What the simple strategies score:",
        "  always pick the longest option: " + (alwaysLongest * 100).toFixed(1) + "%",
        "  always pick the shortest option: " + (alwaysShortest * 100).toFixed(1) + "%",
        "  pick uniformly at random:         " + (random * 100).toFixed(1) + "%",
        "  longest is the only strategy that beats chance here: " + (alwaysLongest > random ? "yes, by " + ((alwaysLongest - random) * 100).toFixed(1) + " points" : "no"),
        "  questions where the longest option ties the right answer: " + tied,
        "",
        "There is deliberately no positional statistic here. The API returns the correct answer as a value and never says which slot it occupied, so a distribution over A/B/C/D cannot be computed from it at all; a tool that printed one would be inventing it. What the payload does support is the length heuristic above, and that is the strategy a player can really learn.",
        "A pool where the longest option is right far more often than a quarter of the time is a quiz that can be passed without reading the questions, and the fix belongs in the pool rather than in the app.",
    ].join("\n");
}
/** How well-formed the answer sets are, which is what decides whether a question feels fair. */
export async function distractorQuality(args) {
    const amount = Math.max(5, Math.min(50, Math.floor(Number(args?.amount ?? 25)) || 25));
    const batch = await otSample(amount, args?.category, args?.difficulty);
    const qs = batch.questions;
    if (!qs.length)
        throw new TriviaError("No questions were returned to analyse.");
    const distractorCounts = new Map();
    const longCorrect = new Map();
    const closePairs = [];
    const identicalIgnoreCase = [];
    let numericQs = 0;
    let numericClose = 0;
    let longestAlwaysCorrect = 0;
    let comparable = 0;
    for (const q of qs) {
        const correct = decode(q.correct_answer ?? "").trim();
        const wrong = (q.incorrect_answers ?? []).map((a) => decode(a).trim());
        distractorCounts.set(wrong.length, (distractorCounts.get(wrong.length) ?? 0) + 1);
        const cl = correct.length;
        longCorrect.set(cl > 30 ? "over 30 chars" : cl > 15 ? "16 to 30 chars" : "15 chars or fewer", (longCorrect.get(cl > 30 ? "over 30 chars" : cl > 15 ? "16 to 30 chars" : "15 chars or fewer") ?? 0) + 1);
        const lens = wrong.map((w) => Math.abs(w.length - cl));
        if (lens.length) {
            comparable += 1;
            if (cl > Math.max(...wrong.map((w) => w.length)))
                longestAlwaysCorrect += 1;
        }
        if (Math.min(...lens, Infinity) <= 3 && correct.length > 6) {
            closePairs.push(`"${correct}" against ${wrong.filter((w) => Math.abs(w.length - cl) <= 3).join(", ")}`);
        }
        const all = [correct, ...wrong].map((a) => a.toLowerCase());
        if (new Set(all).size !== all.length)
            identicalIgnoreCase.push(`"${correct}" repeated in the same question`);
        const cn = otNumberish(correct);
        if (cn !== null) {
            numericQs += 1;
            const nums = wrong.map(otNumberish).filter((n) => n !== null);
            if (nums.some((n) => cn !== 0 && Math.abs(n - cn) / Math.max(1, Math.abs(cn)) < 0.05))
                numericClose += 1;
        }
    }
    return [
        `Distractor quality over ${qs.length} question(s) from opentdb${args?.category !== undefined ? `, category ${args.category}` : ""}${args?.difficulty ? `, difficulty ${args.difficulty}` : ""}`,
        "",
        "How many wrong answers each question offers:",
        ...[...distractorCounts.entries()].sort((a, b) => a[0] - b[0]).map(([n, c]) => `  ${n} distractor(s): ${String(c).padStart(4)} question(s)`),
        "",
        "Length of the correct answer:",
        ...[...longCorrect.entries()].map(([k, c]) => `  ${k.padEnd(16)} ${String(c).padStart(4)} question(s)`),
        `  ${comparable ? longestAlwaysCorrect : 0} of ${comparable} questions have the correct answer as the longest option, which is the heuristic most quiz apps fall back on and the one players learn to exploit`,
        "",
        `Numeric answers: ${numericQs} question(s), of which ${numericClose} have a distractor within 5% of the correct value`,
        `Answer sets with a near-length match: ${closePairs.length}`,
        ...closePairs.slice(0, OT_LIST_CAP).map((p) => `  ${p}`),
        identicalIgnoreCase.length ? `Answer sets with a repeated value: ${identicalIgnoreCase.length}` : "",
        ...identicalIgnoreCase.slice(0, 4).map((p) => `  ${p}`),
        "",
        "Picking the longest answer is a real strategy, not a joke: it beats chance on pools written by people who knew the fact was hard and reached for a short factual answer as the correct one. Measuring how often the longest option is right, over this many questions, tells you whether a quiz is exposed to it.",
        "A distractor within a few characters of the right length is a hint to anyone reading rather than guessing, and a numeric distractor within a few per cent does the same for anyone who can estimate.",
    ]
        .filter(Boolean)
        .join("\n");
}
