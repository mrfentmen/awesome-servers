export declare class NycArrestsError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchArrests(opts: {
    borough?: string;
    offense?: string;
    from?: string;
    to?: string;
    age?: string;
    sex?: string;
    limit?: string;
}): Promise<string>;
export declare function arrestDetails(arrestKey: string): Promise<string>;
export declare function historicSearch(opts: {
    borough?: string;
    offense?: string;
    from?: string;
    to?: string;
    age?: string;
    sex?: string;
    limit?: string;
}): Promise<string>;
export declare function topOffenses(borough?: string, limit?: string): Promise<string>;
export declare function precinctActivity(precinct: string, limit?: string): Promise<string>;
export declare function boroughStats(borough: string): Promise<string>;
export declare function recentFelonies(limit?: string): Promise<string>;
export declare function recentMisdemeanors(limit?: string): Promise<string>;
export declare function offenseLookup(pdCode: string, limit?: string): Promise<string>;
export declare function arrestMapData(latMin: string, latMax: string, lonMin: string, lonMax: string, limit?: string): Promise<string>;
export declare function datasetCoverage(): Promise<string>;
