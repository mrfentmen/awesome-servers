export declare class PiholeError extends Error {
}
export declare function blockingStatus(): Promise<string>;
export declare function setBlocking(enabled: boolean, seconds?: number): Promise<string>;
export declare function summaryStats(): Promise<string>;
export interface PiholeForumArgs {
    query: string;
    limit?: number;
}
export declare function communitySearch(args: PiholeForumArgs): Promise<string>;
