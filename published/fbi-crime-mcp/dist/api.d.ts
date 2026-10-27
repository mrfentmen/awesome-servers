export declare class FbiError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function arrests(state: string): Promise<string>;
export declare function offenses(state: string): Promise<string>;
export declare function victims(state: string): Promise<string>;
export interface StateComparisonArgs {
    dataset?: string;
    measure?: string;
    limit?: number;
    states?: string;
}
/**
 * Every state at once. The three existing tools each fetch one state, so no
 * comparison between states is possible with them, and a per-state number in
 * isolation says nothing about whether it is high.
 */
export declare function stateComparison(args: StateComparisonArgs): Promise<string>;
export interface CrimeTrendArgs {
    state: string;
    dataset?: string;
    start_year?: number;
    end_year?: number;
    measure?: string;
}
/**
 * One state across years. The existing tools return a single aggregate, so a
 * trend, a turning point or a single bad year cannot be seen at all.
 */
export declare function crimeTrend(args: CrimeTrendArgs): Promise<string>;
export interface CrimeSnapshotArgs {
    state: string;
    top?: number;
}
/**
 * The three existing tools return one raw JSON dump each. This joins arrests,
 * offenses and victims for one state into a single readable report, which is the
 * only way the three views can be read against each other.
 */
export declare function crimeSnapshot(args: CrimeSnapshotArgs): Promise<string>;
