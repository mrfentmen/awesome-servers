export declare class BulbapediaError extends Error {
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
export declare function formatArticle(a: Article): string;
export interface DetailsArgs {
    title: string;
}
export interface CategoryArgs {
    category: string;
    limit?: number;
    namespace?: number;
}
export interface LinksArgs {
    title: string;
    limit?: number;
    redirects?: boolean;
}
export declare function pageLinks(args: LinksArgs): Promise<string>;
