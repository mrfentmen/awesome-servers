export declare class NasaImagesError extends Error {
}
export declare function searchMedia(query: string, mediaType: string, limit: number): Promise<string>;
export declare function itemDetail(nasaId: string): Promise<string>;
export declare function assetFiles(nasaId: string): Promise<string>;
export declare function byCenter(center: string, limit: number): Promise<string>;
export declare function recentMedia(yearStart: number, limit: number): Promise<string>;
export declare function keywordSummary(query: string, limit: number): Promise<string>;
