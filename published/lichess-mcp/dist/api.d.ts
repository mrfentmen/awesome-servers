export declare class LichessError extends Error {
}
export interface Puzzle {
    id: string;
    fen: string;
    moves: string[];
    rating: number;
    ratingDeviation?: number;
    popularity?: number;
    themes?: string[];
    gameUrl?: string;
}
export interface Player {
    username: string;
    title?: string;
    rating?: number;
    perfs?: Record<string, {
        rating?: number;
        games?: number;
        prog?: number;
    }>;
    createdAt?: number;
    seenAt?: number;
    count?: {
        all?: number;
    };
}
export declare function getDailyPuzzle(): Promise<Puzzle | null>;
export declare function getPuzzleById(id: string): Promise<Puzzle | null>;
export declare function getPlayer(username: string): Promise<Player | null>;
export declare function getTopPlayers(perf: string, limit?: number): Promise<Player[]>;
/** UCI move list → readable SAN-ish hint list (pairs are white/black). */
export declare function formatPuzzle(p: Puzzle): string;
export declare function formatPlayer(u: Player): string;
