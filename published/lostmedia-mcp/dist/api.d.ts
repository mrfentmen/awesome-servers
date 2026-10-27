export declare class LostMediaError extends Error {
}
export interface SearchHit {
    title: string;
    snippet: string;
}
export declare function searchArticles(query: string, limit?: number): Promise<SearchHit[]>;
export interface Article {
    title: string;
    url?: string;
    extract: string;
}
export declare function getArticle(title: string): Promise<Article | null>;
export declare function randomArticle(): Promise<{
    title: string;
}>;
export declare function statusOf(title: string, extract: string): string;
export declare function formatArticle(a: Article): string;
export interface RecentChangesArgs {
    limit?: number;
}
export interface BrowseCategoriesArgs {
    prefix?: string;
    limit?: number;
}
