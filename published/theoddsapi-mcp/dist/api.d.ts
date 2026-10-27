export declare class OddsError extends Error {
}
export interface Sport {
    key: string;
    title?: string;
    group?: string;
}
export declare function listSports(): Promise<Sport[]>;
export interface GameOdds {
    home?: string;
    away?: string;
    start?: string;
    books: string[];
}
export declare function gameOdds(sport: string, limit?: number): Promise<GameOdds[]>;
export declare function formatGame(g: GameOdds, index?: number): string;
/** Real fixtures with real recent form, which is the input a price has to be judged against. */
export declare function fixtureForm(args: {
    league?: string;
    limit?: number;
    form?: number;
}): Promise<string>;
