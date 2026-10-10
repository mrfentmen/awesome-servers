export declare class BomError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getDailyForecast(lat: number, lon: number): Promise<string>;
export declare function getHourlyForecast(lat: number, lon: number): Promise<string>;
export declare function getObservations(product: string, stationId: string): Promise<string>;
export interface ForecastTableArgs {
    lat: number;
    lon: number;
    limit?: number;
}
export interface ForecastHazardsArgs {
    lat: number;
    lon: number;
}
export interface ForecastWindowArgs {
    lat: number;
    lon: number;
    fromDate?: string;
    toDate?: string;
}
export declare function forecast_window(args: ForecastWindowArgs): Promise<string>;
export interface ResolveLocationArgs {
    lat?: number;
    lon?: number;
    geohash?: string;
}
