export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function searchCards(a: {
    name: string;
    page?: number;
    limit?: number;
}): Promise<string>;
export declare function cardDetail(a: {
    cardId: string;
}): Promise<string>;
export declare function setCards(a: {
    setId: string;
    limit?: number;
}): Promise<string>;
export declare function listSets(a: {
    limit?: number;
}): Promise<string>;
