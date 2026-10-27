export declare class YugiohError extends Error {
}
export interface YgoCard {
    id: number;
    name: string;
    type: string;
    frameType?: string;
    desc: string;
    race?: string;
    attribute?: string;
    archetype?: string;
    level?: number;
    atk?: number;
    def?: number;
    scale?: number;
    linkval?: number;
    linkmarkers?: string[];
    card_images?: {
        image_url?: string;
        image_url_small?: string;
    }[];
    card_prices?: {
        tcgplayer_price?: string;
        cardmarket_price?: string;
        ebay_price?: string;
    }[];
    banlist_info?: {
        ban_tcg?: string;
        ban_ocg?: string;
        ban_goat?: string;
    };
    misc_info?: {
        beta?: boolean;
        views?: number;
    }[];
}
export interface BanlistEntry {
    name: string;
    id: number;
    tcg: string;
    ocg: string;
    goat: string;
}
export declare function searchCardsByName(name: string): Promise<YgoCard[]>;
export declare function searchCardsByArchetype(archetype: string): Promise<YgoCard[]>;
export declare function getCardById(id: number): Promise<YgoCard | null>;
export declare function getBanlist(banlist?: "tcg" | "ocg" | "goat"): Promise<BanlistEntry[]>;
export declare function formatCard(c: YgoCard, index?: number): string;
export interface TopAttackArgs {
    limit?: number;
    type?: string;
}
export interface StapleArgs {
    limit?: number;
}
export declare function stapleCards(args?: StapleArgs): Promise<string>;
