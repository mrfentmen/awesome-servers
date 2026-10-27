export declare class GpodderError extends Error {
}
export interface Podcast {
    title: string;
    author?: string;
    feed?: string;
    description?: string;
    subscribers?: number;
    logo?: string;
}
export declare function searchPodcasts(query: string, limit?: number): Promise<Podcast[]>;
export declare function topPodcasts(limit?: number): Promise<Podcast[]>;
export interface Tag {
    tag: string;
    title?: string;
    usage?: number;
}
export declare function listTags(limit?: number): Promise<Tag[]>;
export declare function podcastsByTag(tag: string, limit?: number): Promise<Podcast[]>;
export declare function formatPodcast(p: Podcast, index?: number): string;
export interface SearchHostsArgs {
    query: string;
    limit?: number;
}
export interface SearchOverlapArgs {
    queries: string[];
    limit?: number;
}
export declare function searchOverlap(args: SearchOverlapArgs): Promise<string>;
