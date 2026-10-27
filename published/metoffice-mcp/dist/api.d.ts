export declare class MetofficeError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getHourlyForecast(latitude: number, longitude: number): Promise<string>;
export declare function getThreeHourlyForecast(latitude: number, longitude: number): Promise<string>;
export declare function getDailyForecast(latitude: number, longitude: number): Promise<string>;
