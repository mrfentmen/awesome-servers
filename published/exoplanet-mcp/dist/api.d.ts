export declare class ExoplanetError extends Error {
}
export declare function searchPlanets(fragment: string, limit: number): Promise<string>;
export declare function planetDetail(plName: string): Promise<string>;
export declare function systemPlanets(hostname: string): Promise<string>;
export declare function recentDiscoveries(fromYear: number, limit: number): Promise<string>;
export declare function habitableCandidates(limit: number): Promise<string>;
export declare function discoveryStats(fromYear: number): Promise<string>;
