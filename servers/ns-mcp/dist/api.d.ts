export declare class NsError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getDepartures(station: string, maxJourneys?: number): Promise<string>;
export declare function searchStations(query: string): Promise<string>;
export declare function planJourney(fromStation: string, toStation: string, dateTime?: string): Promise<string>;
export declare function getDisruptions(isActive?: boolean): Promise<string>;
export declare function getFares(fromStation: string, toStation: string): Promise<string>;
/** Count the railway stations OpenStreetMap knows in a bounding box, and name the busiest. */
export declare function stationNetworkCensus(args: {
    south: number;
    west: number;
    north: number;
    east: number;
    limit?: number;
}): Promise<string>;
/** Look a Dutch station up on Wikidata for the facts the rail API does not carry. */
export declare function stationWikidataProfile(args: {
    name: string;
    limit?: number;
}): Promise<string>;
