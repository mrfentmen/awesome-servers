export declare class HikingprojectError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getTrails(lat: number, lon: number, maxDistance?: number, maxResults?: number): Promise<string>;
export declare function getTrailById(ids: string): Promise<string>;
