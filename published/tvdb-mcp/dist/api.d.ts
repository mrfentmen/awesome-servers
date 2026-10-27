export declare class TvdbError extends Error {
}
export interface Series {
    id?: string;
    name?: string;
    year?: string;
    network?: string;
    status?: string;
}
export declare function searchSeries(query: string, limit?: number): Promise<Series[]>;
export declare function getSeries(id: string): Promise<string>;
export declare function formatSeries(s: Series, index?: number): string;
