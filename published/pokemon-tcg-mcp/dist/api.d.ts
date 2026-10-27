/**
 * TCGdex API v2 client — the open Pokémon TCG database.
 * Docs: https://www.tcgdex.dev/  (free, no key)
 */
export declare class TcgError extends Error {
}
export interface CardSummary {
    id: string;
    localId: string;
    name: string;
    image?: string;
    category?: string;
    rarity?: string;
    set?: {
        id?: string;
        name?: string;
    };
}
export interface CardDetail {
    id: string;
    name: string;
    category?: string;
    hp?: string;
    types?: string[];
    rarity?: string;
    illustrator?: string;
    abilities?: {
        name?: string;
        effect?: string;
    }[];
    attacks?: {
        name?: string;
        cost?: string[];
        damage?: string;
        effect?: string;
    }[];
    weakness?: {
        type?: string;
        value?: string;
    }[];
    resistances?: {
        type?: string;
        value?: string;
    }[];
    retreat?: number;
    image?: string;
    set?: {
        id?: string;
        name?: string;
    };
    variants?: {
        firstEdition?: boolean;
        holo?: boolean;
        reverse?: boolean;
    };
    prices?: Record<string, Record<string, number>>;
}
export interface SetSummary {
    id: string;
    name: string;
    releaseDate?: string;
    cardCount?: number;
    logo?: string;
}
export declare function searchCards(name: string, rarity?: string, limit?: number): Promise<CardSummary[]>;
export declare function getCard(id: string): Promise<CardDetail | null>;
export declare function listSets(): Promise<SetSummary[]>;
export declare function getSet(id: string): Promise<SetSummary & {
    cards: CardSummary[];
} | null>;
export declare function formatCardSummary(c: CardSummary): string;
export declare function formatCardDetail(c: CardDetail): string;
export declare function formatSet(s: SetSummary): string;
export interface CardsByRarityArgs {
    rarity: string;
    limit?: number;
}
export declare function cardRarities(_args?: unknown): Promise<string>;
