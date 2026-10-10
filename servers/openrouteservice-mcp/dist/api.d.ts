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
/** A road route from OSRM, with the turn-by-turn an OpenStreetMap router can give. */
export declare function osrmRouteSteps(args: {
    from_lat?: number;
    from_lon?: number;
    to_lat?: number;
    to_lon?: number;
    alternatives?: boolean;
}): Promise<string>;
/** The same trip by several modes, from Valhalla, which models them with different cost functions. */
export declare function valhallaModeCompare(args: {
    from_lat?: number;
    from_lon?: number;
    to_lat?: number;
    to_lon?: number;
    modes?: string;
}): Promise<string>;
