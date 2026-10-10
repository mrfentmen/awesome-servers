export declare class PrxError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listPodcasts(page?: string, per?: string): Promise<string>;
export declare function getPodcast(podcastId: string): Promise<string>;
export declare function listEpisodes(page?: string, per?: string): Promise<string>;
export declare function getEpisode(episodeId: string): Promise<string>;
