/**
 * Old School RuneScape client.
 *  - Hiscores:  index_lite.ws returns plain text, one line per skill.
 *  - GE prices: the official runescape.wiki prices API (keyless, free).
 */
declare const HISCORES: Record<string, string>;
export declare class OsrsError extends Error {
}
export interface SkillEntry {
    skill: string;
    rank: number;
    level: number;
    xp: number;
}
export interface ActivityEntry {
    activity: string;
    rank: number;
    score: number;
}
export interface PlayerStats {
    username: string;
    mode: string;
    overall: SkillEntry;
    skills: SkillEntry[];
    activities: ActivityEntry[];
}
export declare function getPlayerStats(username: string, mode?: keyof typeof HISCORES): Promise<PlayerStats>;
export interface PriceInfo {
    name: string;
    id: number;
    high: number;
    low: number;
    members: boolean;
}
export declare function getItemPrice(name: string): Promise<PriceInfo | null>;
export interface HotItem {
    name: string;
    id: number;
    avgHigh: number;
    avgLow: number;
    volume: number;
}
/**
 * Hottest items on the GE right now, ranked by trade volume in the last
 * hour (the wiki prices API exposes current prices + volume; there is no
 * historical change endpoint, so "movement" is measured as activity).
 */
export declare function getHotItems(limit?: number): Promise<HotItem[]>;
export declare function formatStats(p: PlayerStats): string;
export interface ItemSummary {
    id: number;
    name: string;
    members: boolean;
    alch: number;
}
/** Find GE items by partial name, straight off the wiki item mapping. */
export declare function searchItems(query: string, limit?: number): Promise<ItemSummary[]>;
export type Timestep = "5m" | "1h" | "6h" | "24h";
export interface PricePoint {
    timestamp: number;
    avgHigh: number | null;
    avgLow: number | null;
    highVolume: number;
    lowVolume: number;
}
export interface PriceHistory {
    item: ItemSummary;
    timestep: Timestep;
    points: PricePoint[];
}
/** Daily/hourly price series for one item (the wiki keeps ~365 points per step). */
export declare function getPriceHistory(name: string, timestep?: Timestep, points?: number): Promise<PriceHistory | null>;
export interface Flip {
    name: string;
    id: number;
    buy: number;
    sell: number;
    margin: number;
    roiPct: number;
    volume: number;
    potential: number;
}
/**
 * Margin between the instant-buy and instant-sell price, for items that
 * actually trade. `margin * volume` is a rough "gp per hour" signal, so
 * illiquid items with a huge spread do not dominate the list.
 */
export declare function getFlips(limit?: number, minVolume?: number): Promise<Flip[]>;
/**
 * How much of an item actually trades in a day, and how many buy-limit windows
 * that volume represents — the wiki API publishes volume but nothing that
 * relates it to the 4-hourly GE buy limit, which is what a buyer needs.
 */
export declare function itemVolume(args: {
    name?: string;
    limit?: number;
}): Promise<string>;
/**
 * One item's price in every window the wiki publishes (instant, 5 minutes, an
 * hour, a day), so a buy or sell is not made off a single stale print.
 */
export declare function priceWindows(args: {
    name: string;
}): Promise<string>;
/**
 * Which items are worth high-alching right now: the alchemy value against the
 * current sell price, ranked, with the buy limit that caps the profit per
 * window. The nature rune is not included, so the figure is gross.
 */
export declare function alchProfit(args: {
    limit?: number;
    membersOnly?: boolean;
}): Promise<string>;
/**
 * Two players side by side: overall level and XP gap, the skills with the
 * biggest difference, and the activities where both have a score.
 */
export declare function playerCompare(args: {
    playerA: string;
    playerB: string;
    mode?: string;
}): Promise<string>;
/**
 * Search the Old School RuneScape Wiki. The GE tools answer "what does this
 * cost"; this answers "what is this thing", over the same item names.
 */
export declare function wikiSearch(args: {
    query: string;
    limit?: number;
}): Promise<string>;
/**
 * The wiki article for a Grand Exchange item: what it is, where it comes from
 * and how it is classified, next to what the exchange is paying right now.
 */
export declare function itemLore(args: {
    name: string;
}): Promise<string>;
export {};
