export declare class KiwiError extends Error {
}
export declare function findLocations(query: string, limit?: number): Promise<string[]>;
export interface Flight {
    price?: number;
    currency?: string;
    from?: string;
    to?: string;
    departure?: string;
    arrival?: string;
    duration?: string;
    airlines: string[];
    link?: string;
}
export declare function searchFlights(from: string, to: string, dateFrom: string, dateTo: string, limit?: number): Promise<Flight[]>;
export declare function formatFlight(f: Flight, index?: number): string;
/** Airports and city names from the OurAirports data set, which needs no key and never rate limits. */
export declare function airportLookup(args: {
    code?: string;
    city?: string;
    limit?: number;
}): Promise<string>;
/** Does anybody fly this route, and who: the OpenFlights route network, which is a different question from a fare search. */
export declare function routeNetwork(args: {
    from: string;
    to: string;
    limit?: number;
}): Promise<string>;
