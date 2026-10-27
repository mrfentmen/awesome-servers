export declare class WorldBankError extends Error {
}
export declare function searchIndicators(query: string, limit: number): Promise<string>;
export declare function indicatorInfo(code: string): Promise<string>;
export declare function countryInfo(code: string): Promise<string>;
export declare function indicatorSeries(country: string, indicator: string, fromYear: number, toYear: number): Promise<string>;
export declare function compareCountries(countryCodes: string, indicator: string, year: number): Promise<string>;
export declare function latestValue(country: string, indicator: string): Promise<string>;
