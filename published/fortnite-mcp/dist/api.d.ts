export declare class FortniteError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getBrNews(): Promise<string>;
export declare function getBrShop(): Promise<string>;
export declare function getMap(): Promise<string>;
export declare function getAes(): Promise<string>;
export declare function searchCosmetic(name: string, language?: string): Promise<string>;
export declare function getPlaylists(): Promise<string>;
