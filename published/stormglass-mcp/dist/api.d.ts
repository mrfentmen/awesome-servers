export declare class StormglassError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getWeather(lat: number, lng: string, params?: string, start?: string, end?: string): Promise<string>;
export declare function getElevation(lat: number, lng: string): Promise<string>;
export declare function getTides(lat: number, lng: string): Promise<string>;
