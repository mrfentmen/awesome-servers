export declare class QuipError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchThreads(query: string): Promise<string>;
export declare function getThread(threadId: string): Promise<string>;
export declare function listFolders(): Promise<string>;
export declare function getUser(): Promise<string>;
/**
 * One encyclopedia article as a document: its lead, its metadata, the revision it
 * was read at, the knowledge item behind it, and how it is classified. This is
 * the record Quip would otherwise have to be told.
 */
export declare function wikiArticle(args: {
    title: string;
}): Promise<string>;
/**
 * The skeleton of an article: every section heading with its level and anchor,
 * which is the shape a document has before anyone writes a word of it.
 */
export declare function wikiOutline(args: {
    title: string;
    maxDepth?: number;
}): Promise<string>;
/**
 * How a document actually reads: word and sentence counts, a Flesch reading
 * ease and Flesch-Kincaid grade, the heading count, the links it carries and the
 * longest sentence in it. Runs entirely on the text supplied.
 */
export declare function documentProfile(args: {
    text: string;
}): Promise<string>;
