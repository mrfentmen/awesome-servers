export declare class NhlError extends Error {
}
export interface TeamStats {
    teamFullName?: string;
    teamAbbrev?: string;
    gamesPlayed?: number;
    wins?: number;
    losses?: number;
    otLosses?: number;
    points?: number;
    goalsFor?: number;
    goalsAgainst?: number;
    powerPlayPct?: number;
    penaltyKillPct?: number;
}
export interface StandingRow {
    teamAbbrev?: string;
    teamName?: string;
    gamesPlayed?: number;
    wins?: number;
    losses?: number;
    otLosses?: number;
    points?: number;
    pointsPctg?: number;
    goalDifferential?: number;
    conferenceName?: string;
    divisionName?: string;
    streakCode?: string;
}
export interface GameRow {
    id?: number;
    gameState?: string;
    startTimeUTC?: string;
    awayAbbrev?: string;
    homeAbbrev?: string;
    awayScore?: number | null;
    homeScore?: number | null;
}
export declare function getTeamStats(season?: string, limit?: number): Promise<TeamStats[]>;
export declare function getStandings(): Promise<StandingRow[]>;
export declare function getSchedule(): Promise<GameRow[]>;
export declare function formatTeamStats(t: TeamStats): string;
export declare function formatStanding(r: StandingRow, index?: number): string;
export declare function formatGame(g: GameRow): string;
