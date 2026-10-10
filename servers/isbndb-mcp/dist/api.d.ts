export declare class IsbndbError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getBook(isbn: string): Promise<string>;
export declare function searchBooks(query: string, page?: number): Promise<string>;
export declare function getBooksBatch(isbns: string): Promise<string>;
/** Catalog records from the Library of Congress, which publishes its MARC data without a key. */
export declare function locCatalog(args: {
    query: string;
    limit?: number;
}): Promise<string>;
/** The short encyclopaedia summary of a book or an author, for context an ISBN record never carries. */
export declare function bookBackground(args: {
    title: string;
}): Promise<string>;
