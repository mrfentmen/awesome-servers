export declare class EveonlineError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getStatus(datasource?: string): Promise<string>;
export declare function search(query: string, categories: string, strict?: boolean, datasource?: string): Promise<string>;
export declare function getCharacter(characterId: number, datasource?: string): Promise<string>;
export declare function getCorporation(corporationId: number, datasource?: string): Promise<string>;
export declare function getAlliance(allianceId: number, datasource?: string): Promise<string>;
export declare function getMarketPrices(datasource?: string): Promise<string>;
export interface FactionDirectoryArgs {
    faction_id?: number;
    search?: string;
    include_description?: boolean;
}
export interface RegionProfileArgs {
    region_id?: number;
    name_search?: string;
    limit?: number;
}
export interface IncursionWatchArgs {
    faction_id?: number;
    constellation_id?: number;
}
/** Live factional warfare: which constellations are contested, by whom, and whether a boss is present. */
export declare function incursionWatch(args: IncursionWatchArgs): Promise<string>;
