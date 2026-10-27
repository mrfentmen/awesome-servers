export declare class PyPIStatsError extends Error {
}
export interface Recent {
    last_day?: number;
    last_week?: number;
    last_month?: number;
}
export interface Slice {
    category?: string;
    date?: string;
    downloads?: number;
}
export declare function recent(pkg: string): Promise<Recent>;
export declare function byDate(pkg: string, days?: number): Promise<Slice[]>;
export declare function byPythonMajor(pkg: string): Promise<Slice[]>;
export declare function byPythonMinor(pkg: string): Promise<Slice[]>;
export declare function bySystem(pkg: string): Promise<Slice[]>;
export declare function number(n: number | undefined): string;
export declare function totals(r: Recent): string;
export declare function sliceLines(rows: Slice[], label: string, limit?: number): string;
