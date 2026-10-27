export declare class AmadeusError extends Error {
}
export declare function searchAirports(keyword: string, limit?: number): Promise<string[]>;
export interface FlightOffer {
    price?: string;
    currency?: string;
    legs: string[];
}
export declare function searchFlights(origin: string, destination: string, date: string, adults?: number, limit?: number): Promise<FlightOffer[]>;
export declare function formatOffer(o: FlightOffer, index?: number): string;
