export declare class SmogonError extends Error {
}
export interface PokeEntry {
    num: number;
    name: string;
    types: string[];
    baseStats: Record<string, number>;
    abilities?: Record<string, string>;
    tier?: string;
    isNonstandard?: string;
    spriteNum?: number;
}
export interface UsageRow {
    rank: number;
    name: string;
    usagePct: number;
    raw: number;
    rawPct: number;
}
export declare function searchDex(query: string, limit?: number): Promise<PokeEntry[]>;
export declare function getPokemon(name: string): Promise<PokeEntry | null>;
/** Parse a Smogon usage .txt file into ranked rows. */
export declare function parseUsage(text: string): UsageRow[];
export declare function getUsageStats(month: string, format: string, top?: number): Promise<UsageRow[]>;
export declare function listAvailableMonths(): Promise<string[]>;
export declare function formatPoke(p: PokeEntry): string;
export interface ByTypeArgs {
    type: string;
    limit?: number;
}
export interface ByAbilityArgs {
    ability: string;
    limit?: number;
}
