export declare class LanguageToolError extends Error {
}
export interface Match {
    message: string;
    short?: string;
    offset: number;
    length: number;
    fragment: string;
    suggestions: string[];
    rule?: string;
    category?: string;
}
export interface CheckResult {
    matches: Match[];
    truncated: boolean;
}
export declare function checkText(text: string, language?: string): Promise<CheckResult>;
export interface Language {
    code: string;
    name: string;
}
export declare function listLanguages(): Promise<Language[]>;
export declare function formatResult(r: CheckResult): string;
export interface TranslateTextArgs {
    text: string;
    from: string;
    to: string;
}
export interface WordLookupArgs {
    word: string;
    relation: "spelling" | "match" | "rhyme" | "define";
    limit?: number;
}
export declare function usageExamples(args: {
    word: string;
    limit?: number;
}): Promise<string>;
