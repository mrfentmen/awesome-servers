export declare class CodewarsError extends Error {
}
export interface Codewarrior {
    username: string;
    honor?: number;
    clan?: string;
    leaderboard?: number;
    overall?: string;
    totalCompleted?: number;
    languages: string[];
}
export declare function getUser(username: string): Promise<Codewarrior>;
export interface Kata {
    id?: string;
    name?: string;
    rank?: string;
    tags: string[];
}
export declare function getKata(idOrSlug: string): Promise<Kata>;
export declare function formatUser(u: Codewarrior): string;
export declare function formatKata(k: Kata): string;
export interface CompletedArgs {
    username: string;
    page?: number;
    limit?: number;
}
export interface ProgressArgs {
    username: string;
    limit?: number;
}
export interface LanguageFilterArgs {
    filter?: string;
    limit?: number;
}
export declare function completedKata(args: CompletedArgs): Promise<string>;
export declare function supportedLanguages(args: LanguageFilterArgs): Promise<string>;
