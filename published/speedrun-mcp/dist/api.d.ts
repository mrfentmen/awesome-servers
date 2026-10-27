export declare class SpeedrunError extends Error {
}
export interface SpeedrunGame {
    id: string;
    name: string;
    abbreviation: string;
    weblink: string;
    released?: number;
    platformNames: string[];
}
export interface Category {
    id: string;
    name: string;
    type: string;
    rules?: string;
    players?: {
        value: number;
    };
}
export interface RecordEntry {
    place: number;
    player: string;
    time: string;
    date?: string;
    video?: string;
    link: string;
}
export interface RecordCategory {
    category: string;
    type: string;
    records: RecordEntry[];
}
export declare function searchGames(query: string): Promise<SpeedrunGame[]>;
export declare function getCategories(gameId: string): Promise<Category[]>;
export declare function getLeaderboard(gameId: string, categoryId: string, top: number): Promise<{
    game: string;
    category: string;
    entries: RecordEntry[];
} | null>;
export declare function getWorldRecords(gameId: string): Promise<RecordCategory[]>;
export declare function getRunner(userId: string): Promise<any>;
/** ISO-8601 duration ("PT1H02M03.456S") → "1:02:03.456" */
export declare function fmtDuration(iso?: string): string;
export declare function formatGame(g: SpeedrunGame, index: number): string;
export declare function formatRecordCategory(rc: RecordCategory): string;
export interface LatestRunsArgs {
    limit?: number;
}
export interface PlayerPbsArgs {
    userId: string;
    limit?: number;
}
