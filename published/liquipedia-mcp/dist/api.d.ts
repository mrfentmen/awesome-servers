export declare class LiquipediaError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchPages(query: string, wiki?: string, limit?: number): Promise<string>;
export declare function getPage(title: string, wiki?: string): Promise<string>;
export declare function getRecentChanges(wiki?: string, limit?: number): Promise<string>;
export declare function getCategoryMembers(category: string, wiki?: string, limit?: number): Promise<string>;
export declare function getBacklinks(title: string, wiki?: string, limit?: number): Promise<string>;
