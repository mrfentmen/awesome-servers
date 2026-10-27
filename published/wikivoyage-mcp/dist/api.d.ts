export declare class WikivoyageError extends Error {
}
export declare function clean(html: string | undefined): string;
export declare function search(query: string, limit: number): Promise<string>;
export declare function overview(title: string): Promise<string>;
export declare function sections(title: string): Promise<string>;
export declare function nearby(lat: number, lon: number, radius: number, limit: number): Promise<string>;
export declare function links(title: string, limit: number): Promise<string>;
export declare function random(limit: number): Promise<string>;
export declare function randomWithOverviews(limit: number): Promise<string>;
