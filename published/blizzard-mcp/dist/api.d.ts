export declare class BlizzardError extends Error {
}
export declare function wowTokenPrice(region: string): Promise<string>;
export interface Achievement {
    id: number;
    name: string;
}
export declare function wowAchievements(region: string, limit?: number): Promise<Achievement[]>;
export interface Season {
    id: number;
    name?: string;
}
export declare function diabloSeasons(region: string): Promise<Season[]>;
export declare function resetCalendar(args: {
    region: string;
    timezone?: string;
    reset_hour?: number;
    weeks?: number;
}): Promise<string>;
export interface BzItem {
    name: string;
    slot?: string;
    stats: Record<string, number>;
}
export interface BzWeightsArgs {
    items: Array<{
        name: string;
        slot?: string;
        stats: string;
    }>;
    weights: Record<string, number>;
    slots?: string[];
}
