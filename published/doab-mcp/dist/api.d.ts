export declare class DoabError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchBooks(query: string): Promise<string>;
export declare function getItem(prefix: string, suffix: string): Promise<string>;
export declare function collectionItems(args: {
    collection: string;
    limit?: number;
    offset?: number;
}): Promise<string>;
