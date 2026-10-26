export declare class FeedlyError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function profile(): Promise<string>;
export declare function subscriptions(): Promise<string>;
export declare function streamContents(streamId: string, count?: string): Promise<string>;
export interface DiscoverFeedsArgs {
    query: string;
    size?: number;
    offset?: number;
}
/**
 * Feed search, which Feedly serves without a token. This is the only tool in the
 * server that can do anything at all with no credentials, and it is the
 * discovery half of an RSS reader, which the other tools never cover because they
 * all require a token and all operate on feeds you already subscribe to.
 */
export declare function discoverFeeds(args: DiscoverFeedsArgs): Promise<string>;
export interface UnreadCountsArgs {
    top?: number;
    group_by?: string;
}
/**
 * Unread counts across every feed, board and tag. This is the call a reader makes
 * constantly and the server has none of it: profile says who you are,
 * subscriptions says what you read, and neither says how much of it is unread.
 */
export declare function unreadCounts(args: UnreadCountsArgs): Promise<string>;
export interface BoardCatalogueArgs {
    limit?: number;
}
/**
 * Boards and the feeds inside them. The subscriptions endpoint returns a flat list
 * of feeds, so the folder structure a reader actually navigates by is invisible,
 * and two feeds can look unrelated when they are filed together.
 */
export declare function boardCatalogue(args: BoardCatalogueArgs): Promise<string>;
