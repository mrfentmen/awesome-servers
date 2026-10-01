export declare class NsError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getDepartures(station: string, maxJourneys?: number): Promise<string>;
export declare function searchStations(query: string): Promise<string>;
export declare function planJourney(fromStation: string, toStation: string, dateTime?: string): Promise<string>;
export declare function getDisruptions(isActive?: boolean): Promise<string>;
export declare function getFares(fromStation: string, toStation: string): Promise<string>;
