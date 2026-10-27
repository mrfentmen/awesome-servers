export declare class BandcampError extends Error {
}
export interface DiscoverItem {
    kind: string;
    title: string;
    artist: string;
    genre?: string;
    location?: string;
    publishDate?: string;
    url?: string;
    featuredTrack?: string;
    trackDuration?: number;
    streamUrl?: string;
}
export declare function discover(sort?: "top" | "new", genreId?: number, page?: number, limit?: number): Promise<DiscoverItem[]>;
export declare function formatItem(it: DiscoverItem, index?: number): string;
export interface ReleaseDetailsArgs {
    url: string;
}
export interface DiscoverProfileArgs {
    sort?: "top" | "new";
    genre_id?: number;
    page?: number;
}
export declare function discoverProfile(args?: DiscoverProfileArgs): Promise<string>;
