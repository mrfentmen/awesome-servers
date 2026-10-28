export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function top_ports(a: {
    year?: number;
    cargoType?: string;
    limit?: number;
}): Promise<string>;
export declare function port_detail(a: {
    portId: string;
    year?: number;
    limit?: number;
}): Promise<string>;
export declare function ports_in_state(a: {
    state: string;
    year?: number;
    limit?: number;
}): Promise<string>;
export declare function port_trend(a: {
    portId: string;
    cargoType?: string;
    limit?: number;
}): Promise<string>;
export declare function cargo_types(a: Record<string, never>): Promise<string>;
