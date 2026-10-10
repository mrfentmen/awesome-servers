export declare class PublicWwwError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchSnippets(keywords: string): Promise<string>;
/**
 * Search the open source code index for a literal string, the same question
 * PublicWWW answers for the live web but over published source: which
 * repositories use this snippet, and where.
 */
export declare function codeSnippetSearch(args: {
    snippet: string;
    limit?: number;
    language?: string;
}): Promise<string>;
/**
 * Whether a snippet is worth searching for at all: its entropy, how minified or
 * commented it is, and its longest line. Obfuscated, packed and minified code
 * all score high, and a PublicWWW search for one of those returns noise.
 */
export declare function snippetProfile(args: {
    snippet: string;
}): Promise<string>;
