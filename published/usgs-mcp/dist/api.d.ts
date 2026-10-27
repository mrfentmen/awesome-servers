export declare class UsgsError extends Error {
}
export interface Quake {
    id?: string;
    mag?: number;
    place?: string;
    time?: string;
    depthKm?: number;
    lat?: number;
    lon?: number;
    url?: string;
    type?: string;
}
export declare function latestQuakes(magnitude?: string, timeframe?: string, limit?: number): Promise<Quake[]>;
export declare function queryQuakes(minMagnitude?: number, limit?: number, starttime?: string): Promise<Quake[]>;
/** One event by its USGS id (e.g. us7000abcd). */
export declare function quakeDetail(id: string): Promise<Quake>;
/** Earthquakes within a radius of a point, strongest first. */
export declare function quakesNear(latitude: number, longitude: number, radiusKm: number, minMagnitude: number, limit: number): Promise<Quake[]>;
/** Strongest earthquakes over the last N days. */
export declare function biggestQuakes(days: number, minMagnitude: number, limit: number): Promise<Quake[]>;
export declare function formatQuake(q: Quake): string;
