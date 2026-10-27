export declare class StardewError extends Error {
}
export interface SearchHit {
    title: string;
    snippet: string;
}
export declare function searchWiki(query: string, limit?: number): Promise<SearchHit[]>;
/** Best-effort wikitext -> readable text. */
export declare function cleanWikitext(wikitext: string): string;
export interface Article {
    title: string;
    url?: string;
    image?: string;
    text: string;
}
export declare function getPage(title: string): Promise<Article | null>;
export declare function randomPage(): Promise<{
    title: string;
}>;
export declare function formatArticle(a: Article): string;
