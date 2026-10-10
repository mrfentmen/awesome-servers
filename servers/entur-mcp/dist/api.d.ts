export declare class EnturError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function autocompleteStop(query: string, lang?: string): Promise<string>;
export declare function reverseGeocode(latitude: number, longitude: number, lang?: string): Promise<string>;
export declare function getDepartures(stopPlaceId: string, departures?: number): Promise<string>;
export declare function planTrip(from: string, to: string, dateTime?: string): Promise<string>;
