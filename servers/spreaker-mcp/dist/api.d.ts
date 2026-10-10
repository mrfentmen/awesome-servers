export declare class SpreakerError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getShow(showId: string): Promise<string>;
export declare function listShowEpisodes(showId: string, limit?: string): Promise<string>;
export declare function getEpisode(episodeId: string): Promise<string>;
export declare function searchShows(query: string, limit?: string): Promise<string>;
export declare function createShow(title: string, language: string): Promise<string>;
/**
 * Who is behind a Spreaker account: how many shows they run, what those shows
 * are categorised as, how recently each was updated, how much of the output is
 * flagged explicit or machine-generated, and who follows them. A show listing
 * cannot answer this, and a publisher spanning hundreds of feeds is exactly the
 * case where it matters.
 */
export declare function publisherProfile(args: {
    user_id: string;
    limit?: number;
}): Promise<string>;
/**
 * Find individual episodes anywhere on Spreaker by keyword, which the show-scoped
 * episode list cannot do: it returns the show each hit belongs to, so a phrase
 * can be traced back to the feed that published it.
 */
export declare function episodeSearch(args: {
    query: string;
    limit?: number;
}): Promise<string>;
