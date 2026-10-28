export declare class ChessError extends Error {
}
export interface Player {
    username?: string;
    name?: string;
    title?: string;
    followers?: number;
    country?: string;
    joined?: number;
    last_online?: number;
    url?: string;
    status?: string;
    avatar?: string;
}
export declare function getPlayer(username: string): Promise<Player | null>;
export declare function getPlayerStats(username: string): Promise<Record<string, any>>;
export declare function getPlayerGames(username: string, year: number, month: number): Promise<any[]>;
export declare function getLeaderboards(): Promise<Record<string, any[]>>;
export declare function getTitledPlayers(title: string): Promise<string[]>;
export declare function formatPlayer(p: Player): string;
export declare function formatStats(stats: Record<string, any>): string;
export declare function formatGame(g: any, index?: number): string;
export declare function formatBoardRow(r: any): string;
