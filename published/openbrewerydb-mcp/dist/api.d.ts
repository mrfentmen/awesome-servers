export declare class BreweryError extends Error {
}
export declare const TYPES: readonly ["micro", "nano", "regional", "brewpub", "large", "planning", "bar", "contract", "proprietor", "closed"];
export declare function searchBreweries(query: string, limit: number): Promise<string>;
export declare function byState(state: string, limit: number): Promise<string>;
export declare function byCity(city: string, limit: number): Promise<string>;
export declare function byType(type: string, limit: number): Promise<string>;
export declare function byCountry(country: string, limit: number): Promise<string>;
export declare function breweryDetail(id: string): Promise<string>;
export declare function randomBreweries(size: number): Promise<string>;
