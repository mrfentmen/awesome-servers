export declare class LaunchLibraryError extends Error {
}
export declare function upcomingLaunches(limit: number): Promise<string>;
export declare function recentLaunches(limit: number): Promise<string>;
export declare function launchDetail(id: string): Promise<string>;
export declare function launchesBySearch(term: string, limit: number): Promise<string>;
export declare function upcomingEvents(limit: number): Promise<string>;
export declare function listAgencies(limit: number, country?: string): Promise<string>;
