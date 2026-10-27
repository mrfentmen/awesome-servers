export declare class SeoulError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getAirQuality(): Promise<string>;
export declare function getStationAir(gu: string): Promise<string>;
