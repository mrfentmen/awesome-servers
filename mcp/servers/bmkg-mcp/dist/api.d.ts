export declare class BmkgError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getForecast(adm4: string): Promise<string>;
export declare function getFeltEarthquakes(): Promise<string>;
export declare function getLatestEarthquakes(): Promise<string>;
export declare function warningDetail(args: {
    alertUrl: string;
}): Promise<string>;
