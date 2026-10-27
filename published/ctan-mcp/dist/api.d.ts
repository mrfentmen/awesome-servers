export declare class CtanError extends Error {
}
export interface CtanPackage {
    key: string;
    name?: string;
    caption?: string;
    authors: string[];
    version?: string;
    ctanPath?: string;
    mirrors: string[];
}
export declare function getPackage(key: string): Promise<CtanPackage>;
export declare function formatPackage(p: CtanPackage): string;
/** The licence vocabulary CTAN itself uses, so a package licence can be read as free or not. */
export declare function licenseCatalog(_args: Record<string, never>): Promise<string>;
