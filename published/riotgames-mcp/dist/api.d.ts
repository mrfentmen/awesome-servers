export declare class RiotgamesError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getAccountByRiotId(gameName: string, tagLine: string, cluster?: string): Promise<string>;
export declare function getLolSummoner(puuid: string, platform?: string): Promise<string>;
export declare function getLolMatchIds(puuid: string, cluster?: string, count?: number): Promise<string>;
export declare function getLolMatch(matchId: string, cluster?: string): Promise<string>;
export declare function getLolChampionMastery(puuid: string, platform?: string, count?: number): Promise<string>;
export declare function getDdragonVersions(): Promise<string>;
