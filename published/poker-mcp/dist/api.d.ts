export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function evaluateHand(a: {
    cards: string[];
}): Promise<string>;
export declare function compareHands(a: {
    first: string[];
    second: string[];
}): Promise<string>;
export declare function bestHandOfSeven(a: {
    cards: string[];
}): Promise<string>;
