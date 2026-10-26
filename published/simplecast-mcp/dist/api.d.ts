export declare function errorMessage(e: unknown): string;
export declare function searchPodcasts(args: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function searchEpisodes(args: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function podcastCharts(args: {
    country?: string;
    limit?: number;
}): Promise<string>;
export declare function podcastDetails(args: {
    podcastId?: number;
    name?: string;
}): Promise<string>;
interface FeedEpisode {
    title: string;
    date: string;
    durationSeconds: number | null;
    audioUrl: string | null;
    link: string | null;
    description: string;
}
interface ParsedFeed {
    title: string;
    description: string;
    language: string;
    link: string | null;
    episodes: FeedEpisode[];
}
/** Handles the three duration formats feeds use: seconds, MM:SS and HH:MM:SS. */
export declare function parseDuration(raw: string | null): number | null;
/** A small RSS/Atom reader — enough for podcast feeds, no extra dependency. */
export declare function parseFeed(xml: string): ParsedFeed;
export declare function latestEpisodes(args: {
    feedUrl: string;
    count?: number;
}): Promise<string>;
export declare function podcastStats(args: {
    feedUrl: string;
}): Promise<string>;
export declare function comparePodcasts(args: {
    feedA: string;
    feedB: string;
}): Promise<string>;
export {};
