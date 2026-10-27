export declare class WikisourceError extends Error {
}
export declare function searchTitles(query: string, limit?: number): Promise<unknown>;
export declare function extract(title: string, introOnly: boolean, limit: number): Promise<unknown>;
export declare function format(value: unknown): string;
export interface PageSummaryArgs {
    title?: string;
    maxCharacters?: number;
}
export interface PageCategoriesArgs {
    title?: string;
    limit?: number;
}
export declare function pageBacklinks(args: {
    title: string;
    limit?: number;
}): Promise<string>;
