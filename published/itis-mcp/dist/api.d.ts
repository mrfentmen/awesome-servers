export declare class ItisError extends Error {
}
export interface Taxon {
    tsn: string;
    name: string;
    author?: string;
    kingdom?: string;
    rank?: string;
}
export declare function searchScientific(name: string, limit?: number): Promise<Taxon[]>;
export declare function commonNames(tsn: string, limit?: number): Promise<string[]>;
export declare function hierarchy(tsn: string): Promise<string[]>;
export declare function formatTaxon(t: Taxon, index?: number): string;
/** Every synonym ITIS holds for a taxon, with the name each one redirects to and whether the taxon itself is accepted. */
export declare function synonymReport(args: {
    tsn?: string;
    limit?: number;
}): Promise<string>;
export interface TaxonRangeArgs {
    tsn?: string;
    limit?: number;
    ancestors?: number;
}
