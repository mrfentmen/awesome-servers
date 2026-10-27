export declare class DfError extends Error {
}
export interface WikiPage {
    pageid: number;
    title: string;
    snippet?: string;
}
export declare function searchPages(query: string, limit?: number): Promise<WikiPage[]>;
export declare function getPage(title: string, maxChars?: number): Promise<{
    title: string;
    wikitext: string;
    url: string;
} | null>;
export declare function wikiTextToPlain(wt: string, maxChars?: number): string;
export interface DfDetailsArgs {
    title: string;
}
export interface DfCategoryArgs {
    category: string;
    limit?: number;
}
export interface DfLinksArgs {
    title: string;
    limit?: number;
    search?: string;
}
export declare function pageLinks(args: DfLinksArgs): Promise<string>;
