export declare class ListenError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function search(query: string): Promise<string>;
export declare function bestPodcasts(page?: string): Promise<string>;
export declare function getEpisode(episodeId: string): Promise<string>;
export declare function justListen(): Promise<string>;
export declare function getPodcast(podcastId: string): Promise<string>;
export declare function podcastRecommendations(podcastId: string): Promise<string>;
export declare function listGenres(): Promise<string>;
export declare function trendingSearches(): Promise<string>;
/** Search the Apple Podcasts catalogue, which is public and needs no key. */
export declare function applePodcastSearch(args: {
    term: string;
    limit?: number;
}): Promise<string>;
/** Read a show's own RSS feed and measure how consistently it publishes. */
export declare function podcastFeedCadence(args: {
    feed: string;
    limit?: number;
}): Promise<string>;
