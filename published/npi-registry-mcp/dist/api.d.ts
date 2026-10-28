export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function providerByNpi(a: {
    npi: string;
}): Promise<string>;
export declare function searchProviders(a: {
    lastName?: string;
    firstName?: string;
    state?: string;
    taxonomies?: string;
    limit?: number;
}): Promise<string>;
export declare function searchOrganizations(a: {
    name: string;
    state?: string;
    city?: string;
    limit: number;
}): Promise<string>;
export declare function providersByTaxonomy(a: {
    taxonomy: string;
    state?: string;
    limit: number;
}): Promise<string>;
export declare function providersByCity(a: {
    city: string;
    state: string;
    limit: number;
}): Promise<string>;
