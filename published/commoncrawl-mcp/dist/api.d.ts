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
export {};
