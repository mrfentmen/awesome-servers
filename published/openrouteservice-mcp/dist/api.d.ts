export declare class OrsError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function geocode(query: string, limit?: string): Promise<string>;
export declare function reverse(lat: string, lon: string): Promise<string>;
export declare function directions(fromLon: string, fromLat: string, toLon: string, toLat: string): Promise<string>;
/** Geocode against OpenStreetMap itself, so you can see how the answer moves between geocoders. */
export declare function nominatimLookup(args: {
    query?: string;
    lat?: number;
    lon?: number;
    limit?: number;
}): Promise<string>;
