export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function stateDrought(a: {
    stateFips: number;
    start: string;
    end: string;
    weekly: boolean;
}): Promise<string>;
export declare function compareStates(a: {
    stateFips: number[];
    date: string;
}): Promise<string>;
export declare function countyDrought(a: {
    countyFips: string;
    date: string;
}): Promise<string>;
export declare function nationalSummary(a: {
    date: string;
}): Promise<string>;
export declare function droughtTrend(a: {
    stateFips: number;
    weeks: number;
}): Promise<string>;
