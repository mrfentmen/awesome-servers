export declare class Gw2Error extends Error {
}
export interface Gw2Item {
    id: number;
    name: string;
    type?: string;
    rarity?: string;
    level?: number;
    vendor_value?: number;
    icon?: string;
    description?: string;
    flags?: string[];
    details?: {
        type?: string;
    };
}
export interface Price {
    id: number;
    buys: {
        unit_price: number;
        quantity: number;
    };
    sells: {
        unit_price: number;
        quantity: number;
    };
}
export interface Achievement {
    id: number;
    name: string;
    description?: string;
    tier?: {
        count: number;
        points: number;
    }[];
    points?: number;
    type?: string;
    icon?: string;
}
/** Search items by name via the wiki, resolving each hit to an API item. */
export declare function searchItems(name: string, limit?: number): Promise<Gw2Item[]>;
export declare function getItem(id: number): Promise<Gw2Item | null>;
export declare function getItemPrice(id: number): Promise<Price | null>;
export declare function getAchievement(id: number): Promise<Achievement | null>;
/** Daily achievements. The endpoint has been returning 503s upstream, so
 *  we retry with 2s / 4s / 6s backoff before giving up cleanly. */
export declare function getDailyAchievements(): Promise<{
    id: number;
    level_min?: number;
}[]>;
export declare function fmtGold(copper: number): string;
export declare function formatItem(i: Gw2Item): string;
export declare function formatPrice(p: Price): string;
export declare function formatAchievement(a: Achievement): string;
