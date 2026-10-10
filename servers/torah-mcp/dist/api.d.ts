export declare class TorahError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getWeeklyPortion(latitude?: number, longitude?: number, timezone?: string): Promise<string>;
export declare function getTanakhText(ref: string, language?: string): Promise<string>;
export declare function getCommentaries(ref: string, commentator?: string, maxResults?: number): Promise<string>;
export declare function getConnections(ref: string, category?: string): Promise<string>;
export declare function searchTexts(query: string, size?: number): Promise<string>;
/** The structure of a book: how Sefaria addresses it and who wrote it. */
export declare function bookIndex(args: {
    book?: string;
}): Promise<string>;
/** Dictionary lookup for a Hebrew or Aramaic word, from Sefaria's lexicon. */
export declare function wordLookup(args: {
    word?: string;
    limit?: number;
}): Promise<string>;
