export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function randomDogImage(a: {
    breed?: string;
    subBreed?: string;
}): Promise<string>;
export declare function listBreeds(a: {
    limit?: number;
}): Promise<string>;
export declare function breedImages(a: {
    breed: string;
    subBreed?: string;
    limit?: number;
}): Promise<string>;
