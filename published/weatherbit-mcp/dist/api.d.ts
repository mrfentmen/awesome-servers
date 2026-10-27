export declare class WeatherbitError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getCurrent(lat: number, lon: number): Promise<string>;
export declare function getDailyForecast(lat: number, lon: number, days?: number): Promise<string>;
export declare function getHourlyForecast(lat: number, lon: number, hours?: number): Promise<string>;
export declare function getAlerts(lat: number, lon: number): Promise<string>;
export declare function getAirQuality(lat: number, lon: number): Promise<string>;
