export declare class IsbndbError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getBook(isbn: string): Promise<string>;
export declare function searchBooks(query: string, page?: number): Promise<string>;
export declare function getBooksBatch(isbns: string): Promise<string>;
