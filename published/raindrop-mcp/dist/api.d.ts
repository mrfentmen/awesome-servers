export declare class RaindropError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function user(): Promise<string>;
export declare function collections(): Promise<string>;
export declare function raindrops(collectionId: string): Promise<string>;
/**
 * What a link actually is, before anything is saved to it: the oEmbed card when
 * the site publishes one, otherwise the Open Graph and Twitter card tags and the
 * document title, with the HTTP status the link currently returns.
 */
export declare function linkPreview(args: {
    url: string;
}): Promise<string>;
/**
 * What a book actually is, from Open Library: the work's description, its first
 * publication, how many editions exist, the subjects and the average rating, so
 * a link to a book can be judged before it is saved.
 */
export declare function bookLookup(args: {
    title: string;
    author?: string;
    limit?: number;
}): Promise<string>;
