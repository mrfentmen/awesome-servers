export declare class MlbError extends Error {
}
export declare function teams(sportId: number): Promise<string>;
export declare function standings(leagueId: string, seasonYear?: number): Promise<string>;
export declare function schedule(date: string, sportId: number): Promise<string>;
export declare function teamRoster(teamId: number, seasonYear?: number): Promise<string>;
export declare function teamRecord(teamId: number, seasonYear?: number): Promise<string>;
export declare function playerInfo(personId: number): Promise<string>;
export declare function teamSchedule(teamId: number, seasonYear?: number): Promise<string>;
