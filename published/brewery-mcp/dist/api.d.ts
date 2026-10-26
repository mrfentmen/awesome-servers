export declare class BreweryError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchBreweries(query: string, by?: string, limit?: string): Promise<string>;
export declare function getBrewery(id: string): Promise<string>;
export declare function randomBrewery(): Promise<string>;
export declare function searchAllBreweries(query: string, limit?: number): Promise<string>;
export interface FindArgs {
    city?: string;
    state?: string;
    country?: string;
    type?: string;
    postal?: string;
    sort?: string;
    limit?: number;
}
export declare function findBreweries(args: FindArgs): Promise<string>;
export declare function breweryStats(): Promise<string>;
export declare function autocompleteBreweries(query: string, limit?: number): Promise<string>;
export declare function randomBreweries(count?: number): Promise<string>;
export declare function breweriesByIds(ids: string, limit?: number): Promise<string>;
export interface NearestArgs {
    latitude: number;
    longitude: number;
    sample?: number;
}
export interface CoverageArgs {
    sample?: number;
}
export interface RegionTypesArgs {
    country?: string;
    sample?: number;
}
/** Brewery types per country, from a paged sample of the catalogue. */
export declare function typesByRegion(args: RegionTypesArgs): Promise<string>;
