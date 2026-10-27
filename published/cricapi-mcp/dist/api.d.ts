export declare class CricApiError extends Error {
}
export interface Match {
    id?: string;
    name?: string;
    status?: string;
    date?: string;
    venue?: string;
    score?: string;
}
export declare function currentMatches(limit?: number): Promise<Match[]>;
export declare function matchInfo(id: string): Promise<Match>;
export declare function searchSeries(query: string, limit?: number): Promise<string[]>;
export declare function formatMatch(m: Match, index?: number): string;
export declare function seriesFixtures(args: {
    series?: string;
    year?: number;
    limit?: number;
}): Promise<string>;
export declare function seriesStandings(args: {
    series?: string;
}): Promise<string>;
