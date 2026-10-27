export declare class BkkError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchStops(lat: number, lon: number): Promise<string>;
export declare function getDepartures(stopId: string, minutesAfter?: number): Promise<string>;
