export declare class FredError extends Error {
}
export interface SeriesHit {
    id: string;
    title?: string;
    frequency?: string;
    units?: string;
    updated?: string;
}
export declare function searchSeries(query: string, limit?: number): Promise<SeriesHit[]>;
export declare function seriesObservations(id: string, limit?: number): Promise<string>;
export declare function formatSeries(s: SeriesHit, index?: number): string;
export declare function seriesInfo(id: string): Promise<string>;
export declare function seriesVintages(id: string, limit?: number): Promise<string>;
export declare function releaseTables(releaseId: string): Promise<string>;
export declare function tagList(limit?: number): Promise<string>;
export declare function geoData(id: string, date?: string): Promise<string>;
export declare function releasesList(limit?: number): Promise<string>;
export declare function sourcesList(limit?: number): Promise<string>;
