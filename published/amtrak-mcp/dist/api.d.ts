export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function live_trains(a: {
    limit?: number;
}): Promise<string>;
export declare function train_status(a: {
    train: string;
}): Promise<string>;
export declare function route_trains(a: {
    route: string;
    limit?: number;
}): Promise<string>;
export declare function stations(a: {
    state?: string;
    limit?: number;
}): Promise<string>;
export declare function station(a: {
    code: string;
}): Promise<string>;
