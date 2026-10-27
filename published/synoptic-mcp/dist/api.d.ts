export declare class SynopticError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function findStations(state: string, limit?: number): Promise<string>;
export declare function getTimeseries(stid: string, vars?: string, recent?: number): Promise<string>;
