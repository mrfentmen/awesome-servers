export declare class SimbadError extends Error {
}
export declare function lookupObject(ident: string): Promise<string>;
export declare function coneSearch(ra: number, dec: number, radius?: number, limit?: number): Promise<string>;
export interface ObjectPhotometryArgs {
    ident?: string;
    limit?: number;
}
export interface ObjectReferencesArgs {
    ident?: string;
    limit?: number;
}
export interface ObjectIdentifiersArgs {
    ident?: string;
    limit?: number;
}
export declare function objectIdentifiers(args: ObjectIdentifiersArgs): Promise<string>;
