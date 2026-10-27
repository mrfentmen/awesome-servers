export declare class CommonCrawlError extends Error {
}
type Collection = {
    id?: string;
    name?: string;
    timegate?: string;
    cd?: string;
};
export declare function listCollections(): Promise<Collection[]>;
export declare function latestIndex(): Promise<string>;
export declare function searchCaptures(urlPattern: string, index: string | undefined, page: number, limit: number): Promise<{
    index: string;
    page: number;
    count: number;
    records: any[];
}>;
export declare function format(value: unknown): string;
export interface HistoryArgs {
    url: string;
    index?: string;
    match_type?: string;
    from_year?: number;
    to_year?: number;
    limit?: number;
}
export interface StatsArgs {
    url: string;
    index?: string;
    match_type?: string;
    sample?: number;
}
export interface CollectionArgs {
    id: string;
}
export declare function collectionDetails(args: CollectionArgs): Promise<string>;
export {};
