export declare class QuipError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchThreads(query: string): Promise<string>;
export declare function getThread(threadId: string): Promise<string>;
export declare function listFolders(): Promise<string>;
export declare function getUser(): Promise<string>;
/**
 * How a document actually reads: word and sentence counts, a Flesch reading
 * ease and Flesch-Kincaid grade, the heading count, the links it carries and the
 * longest sentence in it. Runs entirely on the text supplied.
 */
export declare function documentProfile(args: {
    text: string;
}): Promise<string>;
