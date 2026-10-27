export declare class DemozooError extends Error {
}
export interface ProductionSummary {
    id: number;
    title: string;
    authors: string[];
    release_date?: string;
    supertype?: string;
    platforms: string[];
    types: string[];
    demozoo_url?: string;
}
export interface ProductionDetails extends ProductionSummary {
    credits: string[];
    download_links: string[];
}
export interface Releaser {
    id: number;
    name: string;
    is_group: boolean;
    nicks: string[];
    member_of: string[];
    members: string[];
    demozoo_url?: string;
}
type Raw = Record<string, any>;
export declare function toSummary(p: Raw): ProductionSummary;
export declare function searchProductions(query: string, limit?: number): Promise<ProductionSummary[]>;
export declare function getProduction(id: string): Promise<ProductionDetails | null>;
export declare function getReleaser(id: string): Promise<Releaser | null>;
export declare function formatSummary(p: ProductionSummary, index?: number): string;
export declare function formatProduction(p: ProductionDetails): string;
export declare function formatReleaser(r: Releaser): string;
export interface ReleaserProductionsArgs {
    releaser_id: number;
    limit?: number;
}
export interface PlatformArgs {
    platform: string;
    limit?: number;
    start_year?: number;
}
export interface CatalogueArgs {
    include_platforms?: boolean;
    search?: string;
    limit?: number;
}
export declare function referenceCatalogue(args: CatalogueArgs): Promise<string>;
export interface PartiesArgs {
    kind?: string;
    query?: string;
    limit?: number;
    start_year?: number;
}
export declare function partiesAndScenes(args: PartiesArgs): Promise<string>;
export {};
