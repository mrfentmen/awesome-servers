export declare class PoliceTransparencyError extends Error {
}
type Group = "borough" | "law_category" | "offense";
export declare function summarize(group: Group, year?: number, borough?: string, limit?: number): Promise<any>;
export declare function format(value: unknown): string;
export {};
