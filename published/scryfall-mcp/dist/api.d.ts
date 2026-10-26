export declare class ScryfallError extends Error {
}
export interface Card {
    id: string;
    oracle_id: string;
    name: string;
    mana_cost?: string;
    cmc?: number;
    type_line?: string;
    oracle_text?: string;
    flavor_text?: string;
    rarity?: string;
    set?: string;
    set_name?: string;
    collector_number?: string;
    prices?: {
        usd?: string | null;
        usd_foil?: string | null;
        eur?: string | null;
        tix?: string | null;
    };
    image_uris?: {
        normal?: string;
        png?: string;
    };
    rulings_uri?: string;
    colors?: string[];
    legalities?: Record<string, string>;
    keywords?: string[];
    power?: string;
    toughness?: string;
    loyalty?: string;
}
export interface Ruling {
    oracle_id: string;
    source: string;
    published_at: string;
    comment: string;
}
export interface SetInfo {
    code: string;
    name: string;
    released_at?: string;
    card_count?: number;
    set_type?: string;
}
export declare function searchCards(query: string, pageSize?: number): Promise<Card[]>;
export declare function getCardByFuzzyName(name: string): Promise<Card | null>;
export declare function getCardRulings(cardId: string): Promise<Ruling[]>;
export declare function getSets(): Promise<SetInfo[]>;
/** A single random card — handy for deck ideas and discovery. */
export declare function getRandomCard(): Promise<Card>;
/** Cards from one set, e.g. 'dmu'. Scryfall's set: syntax, newest first is not guaranteed. */
export declare function searchSet(setCode: string, pageSize?: number): Promise<{
    total: number;
    cards: Card[];
}>;
export declare function fmtPrice(usd?: string | null): string;
export declare function formatCard(c: Card, index?: number): string;
export declare function formatRuling(r: Ruling, i: number): string;
/** Price breakdown across every market Scryfall tracks, plus the cheapest printing note. */
export declare function formatPrices(c: Card): string;
/**
 * Resolves a whole decklist or want-list in one request, up to Scryfall's limit
 * of 75 identifiers, and names the ones that did not resolve instead of
 * silently dropping them.
 */
export declare function cardsByCollection(args: {
    names: string[];
}): Promise<string>;
/**
 * One exact printing by set code and collector number. Search cannot do this
 * reliably: a set search returns every printing, and the number identifies the
 * one card.
 */
export declare function cardBySetNumber(args: {
    set: string;
    number: string;
}): Promise<string>;
/**
 * Scryfall's symbology: every mana and counter symbol with its meaning, mana
 * value and the SVG file, which is what a card renderer or rules explainer needs.
 */
export declare function manaSymbols(args: {
    query?: string;
    limit?: number;
}): Promise<string>;
/**
 * Name completion, the cheapest way to turn a half-remembered or misspelled
 * card name into one that a search will actually match.
 */
export declare function cardAutocomplete(args: {
    query: string;
}): Promise<string>;
/**
 * What a set is actually made of: the card-type split, the colour identity
 * distribution, a mana-value histogram and the average mana value, all read off
 * the card rows rather than off the set's marketing copy.
 */
export declare function setProfile(args: {
    code: string;
    limit?: number;
}): Promise<string>;
/**
 * Which keyword abilities a set actually uses, counted from the card rows
 * themselves, with each keyword's share of the set and the cards that carry it.
 * A card holding two keywords is counted under both, which is how a keyword
 * index is normally read.
 */
export declare function keywordIndex(args: {
    code: string;
    limit?: number;
}): Promise<string>;
