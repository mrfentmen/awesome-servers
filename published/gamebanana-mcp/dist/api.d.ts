/**
 * GameBanana API v11 client — the game mods database.
 * Docs: https://gamebanana.com/apiv11  (read endpoints are public)
 *
 * The API returns `_`-prefixed keys; we normalize defensively since the
 * shape varies by endpoint and model.
 */
export declare class BananaError extends Error {
}
export interface SearchResult {
    id: number;
    name: string;
    model: string;
    url?: string;
    description?: string;
}
export interface GameInfo {
    id: number;
    name: string;
    url: string;
    subtitle?: string;
    viewCount?: number;
    modCount?: number;
}
export interface ModInfo {
    id: number;
    name: string;
    url: string;
    description?: string;
    author?: string;
    dateAdded?: string;
    viewCount?: number;
    gameName?: string;
    downloadUrl?: string;
    fileSize?: number;
    category?: string;
}
export declare function searchMods(query: string, perPage?: number): Promise<SearchResult[]>;
export declare function searchGames(query: string, perPage?: number): Promise<SearchResult[]>;
export declare function getGame(id: number): Promise<GameInfo | null>;
export declare function getGameMods(gameId: number, perPage?: number): Promise<ModInfo[]>;
export declare function getMod(id: number): Promise<ModInfo | null>;
export declare function fmtBytes(n?: number): string;
export declare function formatSearchResult(r: SearchResult, index: number): string;
export declare function formatGame(g: GameInfo): string;
export declare function formatMod(m: ModInfo): string;
