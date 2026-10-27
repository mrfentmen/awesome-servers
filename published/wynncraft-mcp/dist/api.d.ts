export declare class WynncraftError extends Error {
}
export interface PlayerSummary {
    username: string;
    online: boolean;
    server?: string | null;
    rank: string;
    guild?: string | null;
    playtime?: number;
    characters: string[];
    firstJoin?: string;
    lastJoin?: string;
}
export declare function getPlayer(name: string): Promise<PlayerSummary>;
export interface GuildSummary {
    name: string;
    prefix?: string;
    level?: number;
    territories?: number;
    wars?: number;
    created?: string;
    memberTotal?: number;
    ranks: string[];
}
export declare function getGuild(name: string): Promise<GuildSummary>;
export interface ItemSummary {
    displayName: string;
    type?: string;
    tier?: string;
    level?: number;
    lore?: string;
}
export declare function searchItems(query: string, limit?: number): Promise<ItemSummary[]>;
export declare function formatPlayer(p: PlayerSummary): string;
export declare function formatGuild(g: GuildSummary): string;
export declare function formatItem(it: ItemSummary, index?: number): string;
export declare function mapLocations(args: {
    query?: string;
    limit?: number;
}): Promise<string>;
