export declare class OpenLibraryError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchBooks(query: string, limit?: number): Promise<string>;
export declare function searchByAuthor(name: string, limit?: number): Promise<string>;
export declare function searchBySubject(subject: string, limit?: number): Promise<string>;
export declare function getWork(workId: string): Promise<string>;
export declare function getEdition(editionId: string): Promise<string>;
export declare function getAuthor(authorId: string): Promise<string>;
export declare function authorWorks(authorId: string, limit?: number): Promise<string>;
/** Resolve an ISBN to its edition record, without walking through search first. */
export declare function editionByIsbn(args: {
    isbn: string;
}): Promise<string>;
/**
 * Every edition Open Library knows for a work — the answer to "is there a later
 * or translated printing", which a single work record does not contain.
 */
export declare function workEditions(args: {
    workId: string;
    limit?: number;
}): Promise<string>;
/** A subject as an entity: how many works it holds and which ones Open Library ranks first. */
export declare function subjectOverview(args: {
    subject: string;
    limit?: number;
}): Promise<string>;
/** Whether a book can actually be read today, and through which library. */
export declare function readAvailability(args: {
    isbn?: string;
}): Promise<string>;
/** The Internet Archive's own record of the scanned copy behind a borrowable edition. */
export declare function scannedCopyReport(args: {
    ocaid?: string;
}): Promise<string>;
/** A real aggregation over a search: who publishes this, when it appears, in what language. */
export declare function searchFacets(args: {
    query?: string;
    limit?: number;
}): Promise<string>;
