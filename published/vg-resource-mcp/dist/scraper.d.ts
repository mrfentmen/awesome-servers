import type { AssetEntry, ConsoleEntry, GameEntry, ResourceType } from "./types.js";
export declare function getConsoles(resource: ResourceType): Promise<ConsoleEntry[]>;
export declare function getGames(resource: ResourceType, consoleSlug: string, page?: number): Promise<GameEntry[]>;
export declare function getGameAssets(resource: ResourceType, consoleSlug: string, gameSlug: string): Promise<AssetEntry[]>;
export declare function getAssetDetail(assetUrl: string): Promise<Partial<AssetEntry>>;
export declare function searchAssets(resource: ResourceType, query: string): Promise<AssetEntry[]>;
export declare function getLatestAssets(resource: ResourceType, limit?: number): Promise<AssetEntry[]>;
export declare function getPopularAssets(resource: ResourceType, limit?: number): Promise<AssetEntry[]>;
export declare function getRandomAsset(resource: ResourceType): Promise<AssetEntry | null>;
export declare function downloadAsset(url: string, destPath: string): Promise<{
    success: boolean;
    path: string;
    size: number;
}>;
export declare function getDownloadUrl(assetPageUrl: string): Promise<string>;
export declare function crossReference(gameName: string): Promise<{
    resource: ResourceType;
    assets: AssetEntry[];
}[]>;
