export declare class BmkgError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getForecast(adm4: string): Promise<string>;
export declare function getFeltEarthquakes(): Promise<string>;
export declare function getLatestEarthquakes(): Promise<string>;
/**
 * autogempa.json is the single most recent earthquake with its full description
 * and felt reports. gempaterkini only covers M5 and above, and gempadirasakan
 * starts at magnitude 3, so neither reports the small events this does.
 */
export declare function latestEarthquake(): Promise<string>;
export declare function forecastSummary(args: {
    adm4: string;
    limit?: number;
}): Promise<string>;
export declare function feltEarthquakeSummary(args: {
    limit?: number;
}): Promise<string>;
