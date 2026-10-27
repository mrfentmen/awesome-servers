export declare class KmaError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getForecast(nx?: number, ny?: number, baseDate?: string, baseTime?: string): Promise<string>;
export declare function getUltrashort(nx?: number, ny?: number): Promise<string>;
export declare function getObservations(nx?: number, ny?: number): Promise<string>;
