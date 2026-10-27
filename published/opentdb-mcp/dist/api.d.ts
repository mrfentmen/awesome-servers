/**
 * Open Trivia DB client, keyless.
 * Public trivia API; session tokens stop the same question repeating.
 */
export declare class TriviaError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare const DIFFICULTIES: readonly ["easy", "medium", "hard"];
export interface Question {
    category: string;
    type: string;
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
}
export interface Categories {
    trivia_categories: Array<{
        id: number;
        name: string;
    }>;
}
/** opentdb HTML-escapes question text and answers. */
export declare function decode(raw: string): string;
export declare function listCategories(): Promise<Categories>;
export interface CategoryCount {
    category_id: number;
    category_question_count: {
        total_question_count: number;
        total_easy_question_count: number;
        total_medium_question_count: number;
        total_hard_question_count: number;
    };
}
export declare function categoryCounts(category: string): Promise<CategoryCount>;
export interface GlobalCount {
    overall: {
        total_num_of_questions: number;
        total_num_of_pending_questions: number;
        total_num_of_verified_questions: number;
        total_num_of_rejected_questions: number;
    };
    categories: Record<string, {
        total_num_of_questions: number;
    }>;
}
export declare function globalCounts(): Promise<GlobalCount>;
export declare function questions(amount: number, category?: string, difficulty?: string, token?: string, type?: string): Promise<Question[]>;
export declare function sessionToken(action: "request" | "reset"): Promise<string>;
export declare function formatQuestion(q: Question, index: number): string;
export declare function formatQuiz(list: Question[], title: string): string;
/** Two categories side by side, so a quiz can be built from the easier or harder of the pair. */
export declare function compareCategories(args: {
    a: string;
    b: string;
}): Promise<string>;
/**
 * Whether a planned quiz can actually be served. Open Trivia DB answers a
 * request larger than the pool with response code 1 and no questions at all,
 * which is the failure this check exists to prevent.
 */
export declare function quizReadiness(args: {
    category: string;
    difficulty: string;
    amount: number;
}): Promise<string>;
/**
 * How well moderated each category is: verified questions are checked by a
 * human, pending and rejected ones are not, and a quiz drawn from a mostly
 * unverified category will contain mistakes.
 */
export declare function categoryQuality(args: {
    limit?: number;
    minTotal?: number;
}): Promise<string>;
/** Is each question actually fair to ask, judged from the wording and the answer set. */
export declare function questionFairnessAudit(args: {
    amount?: number;
    category?: number;
}): Promise<string>;
/**
 * Whether a quiz built from this pool can be beaten without knowing anything.
 * The API never returns which slot holds the right answer, so no positional
 * statistic is reported here; what it does expose is enough to measure the
 * strategy a player can actually adopt: pick the longest option.
 */
export declare function quizExploitability(args: {
    batches?: number;
    amount?: number;
    category?: number;
}): Promise<string>;
/** How well-formed the answer sets are, which is what decides whether a question feels fair. */
export declare function distractorQuality(args: {
    amount?: number;
    category?: number;
    difficulty?: string;
}): Promise<string>;
