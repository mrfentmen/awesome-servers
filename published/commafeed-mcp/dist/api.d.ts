export declare class CommaFeedError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getFeedEntries(feedId: string, readType?: string, limit?: string): Promise<string>;
export declare function markEntry(entryId: string, read: string): Promise<string>;
export declare function listEntryTags(): Promise<string>;
export declare function subscribeFeed(url: string): Promise<string>;
