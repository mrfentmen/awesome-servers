export declare class GBooksError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchBooks(query: string, limit?: string): Promise<string>;
export declare function getVolume(volumeId: string): Promise<string>;
export declare function isbnLookup(isbn: string): Promise<string>;
export declare function authorWorks(args: {
    author: string;
    limit?: number;
}): Promise<string>;
