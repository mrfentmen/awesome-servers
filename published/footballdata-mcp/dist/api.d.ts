export declare class FootballDataError extends Error {
}
export interface Competition {
    id: number;
    name?: string;
    code?: string;
    area?: string;
}
export declare function listCompetitions(): Promise<Competition[]>;
export declare function teamMatches(teamId: string, limit?: number): Promise<string[]>;
export declare function formatCompetition(c: Competition, index?: number): string;
